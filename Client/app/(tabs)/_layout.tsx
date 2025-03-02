import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
	const navigation = useNavigation();

	useEffect(() => {
		if (navigation) {
			navigation.setOptions({ title: 'MetroTag' });
		}
	}, [navigation]);

	return (
		<Tabs
			style={styles.bottomTabs}
			screenOptions={{
				title: '',
				tabBarActiveTintColor: '#fefefe',
				headerShown: false,
				tabBarLabel: () => null,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0
					},
					default: {}
				})
			}}
		>
			<Tabs.Screen
				name="tagger"
				options={{
					title: '',
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="house.fill" color={color} />
					)
				}}
			/>
			<Tabs.Screen
				name="runner"
				options={{
					title: '',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="paperplane.fill"
							color={color}
						/>
					)
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	bottomTabs: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1e1e1e',
		padding: 20,
		color: '#fefefe'
	}
});
