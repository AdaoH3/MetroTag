import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			404 - Page Not Found
			<Link href="/" style={styles.link}>
				Go Back To Home
			</Link>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20
	},
	link: {
		marginTop: 15,
		paddingVertical: 15
	}
});
