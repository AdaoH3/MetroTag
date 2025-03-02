import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import Arrow from '../../components/Arrow';

const host_url = `https://43ppk7jt-5000.use.devtunnels.ms`;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const getAngleToPlayer = (
	myLat: number,
	myLon: number,
	playerLat: number,
	playerLon: number
) => {
	const lat1 = toRadians(myLat);
	const lat2 = toRadians(playerLat);
	const lon1 = toRadians(myLon);
	const lon2 = toRadians(playerLon);

	const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
	const x =
		Math.cos(lat1) * Math.sin(lat2) -
		Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

	const angle = toDegrees(Math.atan2(y, x));
	return (angle + 360) % 360; // Normalize angle to 0-360 degrees
};

const Tagger = () => {
	const [angle, setAngle] = useState(0);
	const [location, setLocation] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const [nearestPlayer, setNearestPlayer] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const route = useRoute();
	const lobbyName = (route.params as { lobby?: string })?.lobby || 'global';

	// **Fetch My GPS Location Every Second**
	useEffect(() => {
		const updateLocation = async () => {
			try {
				const loc = await Location.getCurrentPositionAsync({});
				const coords = {
					lat: loc.coords.latitude,
					lon: loc.coords.longitude
				};
				setLocation(coords);
				console.log('My Location:', coords);
			} catch (error) {
				console.error('Error getting location:', error);
			}
		};

		const interval = setInterval(updateLocation, 1000);
		return () => clearInterval(interval);
	}, []);

	// **Fetch Nearest Player Every 5 Seconds**
	useEffect(() => {
		if (!location) return;

		const fetchNearestPlayer = async () => {
			try {
				const response = await fetch(
					`${host_url}/nearby_player?lobby=${lobbyName}`
				);
				const data = await response.json();

				if (data.lat && data.lon) {
					setNearestPlayer({ lat: data.lat, lon: data.lon });
					console.log('Nearest Player:', data);
				} else {
					console.warn('No nearby players found.');
				}
			} catch (error) {
				console.error('Error fetching nearest player:', error);
			}
		};

		const interval = setInterval(fetchNearestPlayer, 5000);
		return () => clearInterval(interval);
	}, [location]);

	// **Recalculate Angle to Nearest Player**
	useEffect(() => {
		if (!location || !nearestPlayer) return;

		const angleToPlayer = getAngleToPlayer(
			location.lat,
			location.lon,
			nearestPlayer.lat,
			nearestPlayer.lon
		);
		setAngle(angleToPlayer);
		console.log(`Angle to nearest player: ${angleToPlayer}°`);
	}, [location, nearestPlayer]);

	return (
		<View style={styles.container}>
			<Text style={styles.infoText}>Arrow points to nearest player</Text>
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
		padding: 20
	},
	infoText: {
		fontSize: 16,
		marginBottom: 10,
		color: 'lightgray'
	},
	angleText: {
		fontSize: 24,
		marginBottom: 20,
		color: '#ffcc00'
	}
});

export default Tagger;
