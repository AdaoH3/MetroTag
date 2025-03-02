import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import Arrow from '../../components/Arrow';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';

const host_url = `https://43ppk7jt-5000.use.devtunnels.ms/`;

const API_URL = `${host_url}/get_game_state?lobby_name=`;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const getAngleToTagger = (
	clientLat: number,
	clientLon: number,
	otherLat: any,
	otherLon: any
) => {
	const lat1 = toRadians(clientLat);
	const lat2 = toRadians(otherLat);
	const lon1 = toRadians(clientLon);
	const lon2 = toRadians(otherLon);

	const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
	const x =
		Math.cos(lat1) * Math.sin(lat2) -
		Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

	const angle = toDegrees(Math.atan2(y, x));
	return (angle + 360) % 360;
};

const Tagger = () => {
	const [angle, setAngle] = useState(0);
	const [location, setLocation] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const route = useRoute();
	const name = (route.params as { name?: string })?.name || 'NoUserName';
	const lobbyName = (route.params as { lobby?: string })?.lobby || 'global';

	useEffect(() => {
		const fetchLocation = async () => {
			const { status } =
				await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') return;
			const loc = await Location.getCurrentPositionAsync({});
			setLocation({
				lat: loc.coords.latitude,
				lon: loc.coords.longitude
			});
		};

		fetchLocation();
	}, []);

	useEffect(() => {
		if (!location) return;

		const fetchGameState = async () => {
			try {
				const response = await fetch(API_URL + lobbyName);
				const data = await response.json();
				if (data.code !== 0 || !data.players) return;

				let nearestRunner = null;
				let minDistance = Infinity;

				for (const playerName in data.players) {
					const player = data.players[playerName];
					if (player.role === 'runner' && !player.is_tagged) {
						const [lat, lon] = player.location;
						const distance = Math.hypot(
							lat - location.lat,
							lon - location.lon
						);
						if (distance < minDistance) {
							minDistance = distance;
							nearestRunner = { lat, lon };
						}
					}
				}

				if (nearestRunner) {
					const angleToRunner = getAngleToTagger(
						location.lat,
						location.lon,
						nearestRunner.lat,
						nearestRunner.lon
					);
					setAngle(angleToRunner);
				}
			} catch (error) {
				console.error('Error fetching game state:', error);
			}
		};

		const interval = setInterval(fetchGameState, 5000);
		return () => clearInterval(interval);
	}, [location]);

	return (
		<View style={styles.container}>
			<Text style={styles.nameText}>Your name: {name}</Text>
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
		marginBottom: 20,
		color: 'white'
	}
});

export default Tagger;
