import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const host_url = `https://43ppk7jt-5000.use.devtunnels.ms`;

type RunnerScreenRouteProp = RouteProp<{ params: { name: string; lobby?: string; role?: string } }, 'params'>;

export default function Runner() {
	const route = useRoute<RunnerScreenRouteProp>();
	const navigation = useNavigation();

	// Retrieve role from params, default to 'tagger' if not specified
	const name = route.params?.name || 'NoUserName';
	const lobby_name = route.params?.lobby || 'global';
	const [role, setRole] = useState(route.params?.role || 'tagger');

	const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [tagged, setTagged] = useState<boolean>(false);

	useEffect(() => {
		let interval: any;

		const startTracking = async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				setErrorMsg('Location tracking not allowed');
				return;
			}

			sendLocation();
			interval = setInterval(sendLocation, 5000);
		};

		const sendLocation = async () => {
			try {
				const loc = await Location.getCurrentPositionAsync({});
				setLocation(loc.coords);

				const data = {
					role: role, // Use the dynamically assigned role
					user_name: name,
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					is_tagged: tagged,
					lobby_name: lobby_name
				};

				await fetch(`${host_url}/update_player_data`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data)
				});

				console.log('Location sent:', data);
			} catch (error) {
				console.error('Error getting or sending location:', error);
			}
		};

		startTracking();

		return () => clearInterval(interval);
	}, [tagged, role]);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Welcome, {name}! You are a {role}.</Text>
			{location ? (
				<Text>
					Lat: {location.latitude}, Lng: {location.longitude}
				</Text>
			) : (
				<Text>{errorMsg || 'Getting location...'}</Text>
			)}
			{role === 'runner' && (
				<Button title="Get Tagged" onPress={() => setTagged(true)} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1e1e1e',
		padding: 20,
		color: '#fefefe'
	},
	text: {
		fontSize: 20,
		color: '#fefefe'
	},
	button: {
		marginTop: 20,
		backgroundColor: '#F55E02',
		color: '#F55E02'
	}
});
