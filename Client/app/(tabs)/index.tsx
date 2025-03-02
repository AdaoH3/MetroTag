import React, { useState } from 'react';
import { Text, StyleSheet, View, Button, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const host_url = `https://43ppk7jt-5000.use.devtunnels.ms/`;

const API_URL = host_url;

export default function HomeScreen() {
	const [name, setName] = useState('');
	const [lobbyName, setLobbyName] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const navigation = useNavigation();

	const handleSubmit = async () => {
		if (!name || !lobbyName) {
			Alert.alert('Error', 'Please enter both username and lobby name.');
			return;
		}

		try {
			const response = await fetch(`${API_URL}/join_game`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lobby_name: lobbyName, user_name: name })
			});

			const data = await response.json();
			if (data.code === 0) {
				setSubmitted(true);
			} else if (data.code === 8) {
				Alert.alert('Error', 'Username already exists in lobby.');
			} else {
				Alert.alert('Error', 'Failed to join lobby.');
			}
		} catch (error) {
			console.error('Error joining lobby:', error);
			Alert.alert('Error', 'Could not connect to server.');
		}
	};

	const createLobby = async () => {
		if (!lobbyName) {
			Alert.alert('Error', 'Please enter a lobby name.');
			return;
		}
		try {
			const response = await fetch(`${API_URL}/create_game`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lobby_name: lobbyName })
			});
			// after you get code 0, you can join the game with the lobby and user name
			const data = await response.json();
			if (data.code === 0) {
				Alert.alert('Success', `Lobby "${lobbyName}" created.`);
			} else if (data.code === 1) {
				Alert.alert('Error', 'Lobby already exists.');
			} else {
				Alert.alert('Error', 'Failed to create lobby.');
			}
		} catch (error) {
			console.error('Error creating lobby:', error);
			Alert.alert('Error', 'Could not connect to server.');
		}
	};

	const handleRoleSelection = (role: string) => {
		navigation.navigate(role === 'tagger' ? 'tagger' : 'runner', {
			name: name,
			lobby: lobbyName
		});
	};

	return (
		<View style={styles.container}>
			{!submitted ? (
				<>
					<Text>What is your Username?</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setName}
						placeholder="Enter your username"
					/>
					<Text>Enter a Lobby Name:</Text>
					<TextInput
						style={styles.input}
						value={lobbyName}
						onChangeText={setLobbyName}
						placeholder="Enter a lobby name"
					/>
					<Button title="Submit" onPress={handleSubmit} />
					<Button title="Create Lobby" onPress={createLobby} />
				</>
			) : (
				<>
					<Text>Hello, {name}! Are you a tagger or a runner?</Text>
					<Button
						title="Tagger"
						onPress={() => handleRoleSelection('tagger')}
					/>
					<Button
						title="Runner"
						onPress={() => handleRoleSelection('runner')}
					/>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16
	},
	input: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		marginBottom: 12,
		paddingHorizontal: 8,
		width: '80%'
	}
});
