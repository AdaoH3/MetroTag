import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import Arrow from '../../components/Arrow';

const host_url = `https://43ppk7jt-5000.use.devtunnels.ms`;

const API_URL = `${host_url}/get_game_state?lobby_name=`;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const getAngleToRunner = (taggerLat: number, taggerLon: number, runnerLat: number, runnerLon: number) => {
	const lat1 = toRadians(taggerLat);
	const lat2 = toRadians(runnerLat);
	const lon1 = toRadians(taggerLon);
	const lon2 = toRadians(runnerLon);

	const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

	const angle = toDegrees(Math.atan2(y, x));
	return (angle + 360) % 360; // Ensure the angle is between 0-360 degrees
};

const Tagger = () => {
	const [angle, setAngle] = useState(0);
	const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
	const [nearestRunner, setNearestRunner] = useState<{ lat: number; lon: number } | null>(null);
	const route = useRoute();
	const name = (route.params as { name?: string })?.name || 'NoUserName';
	const lobbyName = (route.params as { lobby?: string })?.lobby || 'global';
	const role = (route.params as { role?: string })?.role || 'tagger';

	// **Get Tagger GPS Every Second and Send Update**
	useEffect(() => {
		if (role !== 'tagger') return;

		const sendTaggerLocation = async () => {
			try {
				const loc = await Location.getCurrentPositionAsync({});
				const taggerCoords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
				setLocation(taggerCoords);
				console.log(taggerCoords);

				const data = {
					role: 'tagger',
					user_name: name,
					latitude: taggerCoords.lat,
					longitude: taggerCoords.lon,
					is_tagged: true,
					lobby_name: lobbyName
				};

				await fetch(`${host_url}/update_player_data`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});

				console.log('Tagger location sent:', data);
			} catch (error) {
				console.error('Error sending tagger location:', error);
			}
		};

		const interval = setInterval(sendTaggerLocation, 1000);
		return () => clearInterval(interval);
	}, [role]);

	// **Fetch Runners and Find Nearest Every 5 Seconds**
	useEffect(() => {
		if (!location) return;

		const fetchGameState = async () => {
			try {
				const response = await fetch(API_URL + lobbyName);
				const data = await response.json();
				if (data.code !== 0 || !data.players) return;

				let nearest = null;
				let minDistance = Infinity;

				for (const playerName in data.players) {
					const player = data.players[playerName];

					// Only check runners that are NOT tagged
					if (player.role === 'runner' && !player.is_tagged) {
						const [lat, lon] = player.location;
						const distance = Math.hypot(lat - location.lat, lon - location.lon);
						if (distance < minDistance) {
							minDistance = distance;
							nearest = { lat, lon };
						}
					}
				}

				if (nearest) {
					setNearestRunner(nearest);
				}
				console.log('Checking players:', data.players);
				console.log('Tagger location:', location);
			} catch (error) {
				console.error('Error fetching game state:', error);
			}
		};

		const interval = setInterval(fetchGameState, 5000);
		return () => clearInterval(interval);
	}, [location]);

	useEffect(() => {
	if (!location || !nearestRunner) return;

	console.log(`Tagger Location: ${JSON.stringify(location)}`);
	console.log(`Runner Location: ${JSON.stringify(nearestRunner)}`);

	const angleToRunner = getAngleToRunner(location.lat, location.lon, nearestRunner.lat, nearestRunner.lon);

	console.log(`Computed Angle: ${angleToRunner}°`);

	setAngle(angleToRunner);
}, [location, nearestRunner]);

	return (
		<View style={styles.container}>
			<Text style={styles.nameText}>Your name: {name}</Text>
			<Text style={styles.roleText}>Role: {role}</Text>
			<Text style={styles.infoText}>Arrow points to nearest runner</Text>
			<Text style={styles.angleText}>Angle: {Math.round(angle)}°</Text>
			<Arrow angleOffset={angle} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1e1e1e',
		padding: 20,
		color: '#fefefe'
	},
	nameText: {
		fontSize: 20,
		marginBottom: 10,
		color: 'white'
	},
	roleText: {
		fontSize: 18,
		marginBottom: 10,
		color: 'gray'
	},
	infoText: {
		fontSize: 16,
		marginBottom: 10,
		color: 'lightgray'
	},
	angleText: {
		fontSize: 24,
		marginBottom: 20,
		color: '#ffcc00' // Yellow for visibility
	}
});

export default Tagger;
