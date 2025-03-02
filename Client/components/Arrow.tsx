import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Svg, { Polygon } from 'react-native-svg';

type ArrowProps = {
	angleOffset: number;
};

const Arrow: React.FC<ArrowProps> = ({ angleOffset = 0 }) => {
	const alpha = 0.1;
	const [smoothedAngle, setSmoothedAngle] = useState(0);

	useEffect(() => {
		let magSub: any;

		const subscribeMag = async () => {
			const isAvailable = await Magnetometer.isAvailableAsync();
			if (!isAvailable) return;

			Magnetometer.setUpdateInterval(10);

			magSub = Magnetometer.addListener(data => {
				const { x, y } = data;
				let newAngle = Math.atan2(y, x) * (180 / Math.PI);
				newAngle = newAngle < 0 ? newAngle + 360 : newAngle;
				newAngle = (newAngle + angleOffset) % 360;
				setSmoothedAngle(
					prevAngle => alpha * newAngle + (1 - alpha) * prevAngle
				);
			});
		};

		subscribeMag();

		return () => {
			if (magSub) magSub.remove();
		};
	}, [angleOffset]);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>
				Heading:{' '}
				{Math.round((((360 - (90 - smoothedAngle)) % 360) + 360) % 360 + angleOffset)}
				°
			</Text>
			<Text style={styles.text}>
				Relative to Runner: {Math.round(angleOffset)}°
			</Text>
			<View style={styles.arrowContainer}>
				<Svg
					width="100"
					height="100"
					viewBox="0 0 100 100"
					style={{
						transform: [{ rotate: `${90 - smoothedAngle + angleOffset}deg` }]
					}}
				>
					<Polygon points="50,10 90,90 50,75 10,90" fill="white" />
				</Svg>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	text: { fontSize: 20, marginBottom: 20, color: 'white' },
	arrowContainer: { width: 100, height: 100 }
});

export default Arrow;
