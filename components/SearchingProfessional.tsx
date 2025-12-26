import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';

export default function SearchingProfessional() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Animation de pulsation d'opacité (animate-pulse)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation ping (expansion + disparition)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pingScale, {
            toValue: 2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pingOpacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pingScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pingOpacity, {
            toValue: 0.2,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulseAnim, pingScale, pingOpacity]);

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        {/* Ping circle (background) */}
        <Animated.View
          style={[
            styles.pingCircle,
            {
              transform: [{scale: pingScale}],
              opacity: pingOpacity,
            },
          ]}
        />
        {/* Main circle with pulse */}
        <Animated.View
          style={[
            styles.iconCircle,
            {
              opacity: pulseAnim,
            },
          ]}
        >
          <Text style={styles.iconText}>🔍</Text>
        </Animated.View>
      </View>
      <Text style={styles.searchingText}>Recherche d'un professionnel...</Text>
      <Text style={styles.subtitleText}>Cela ne prendra que quelques instants</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  animationContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pingCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5FB17C',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5FB17C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
  },
  searchingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#999',
  },
});
