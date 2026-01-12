import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

const {width, height} = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({onFinish}: SplashScreenProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de rotation du spinner
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animation de la barre de progression
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Fin du splash après 3 secondes
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <ImageBackground
        source={require('../../BackgroundSplash.jpeg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.imageStyle}
      >
        {/* Overlay gradient sombre */}
        <View style={styles.overlay} />

        {/* Contenu */}
        <View style={styles.content}>
          {/* Logo en haut */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <FontAwesome5 name="magic" size={16} color="#fff" />
            </View>
            <Text style={styles.logoText}>CleanHome</Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Texte principal */}
          <View style={styles.textContainer}>
            <Text style={styles.subtitle}>SERVICES DE MÉNAGE À DOMICILE</Text>
            <Text style={styles.title}>Votre intérieur</Text>
            <Text style={styles.titleGreen}>impeccable</Text>
            <Text style={styles.description}>
              Des professionnelles de confiance{'\n'}près de chez vous
            </Text>
          </View>

          {/* Loader et barre de progression */}
          <View style={styles.loaderContainer}>
            <Animated.View style={[styles.spinner, {transform: [{rotate: spin}]}]} />
            <Text style={styles.loadingText}>Chargement...</Text>

            {/* Barre de progression */}
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, {width: progressWidth}]} />
            </View>
          </View>
        </View>

        {/* Badges en bas */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <FontAwesome5 name="star" solid size={16} color="#FFD700" style={styles.badgeIconStar} />
            <Text style={styles.badgeText}>4.9/5</Text>
          </View>
          <View style={styles.badge}>
            <FontAwesome5 name="check" size={16} color={Colors.primary} style={styles.badgeIconCheck} />
            <Text style={styles.badgeText}>500+ pros</Text>
          </View>
          <View style={styles.badge}>
            <FontAwesome5 name="shield-alt" size={16} color="#fff" style={styles.badgeIconShield} />
            <Text style={styles.badgeText}>Assurée</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  imageStyle: {
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoIconText: {
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  spacer: {
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  titleGreen: {
    fontSize: 38,
    fontWeight: '700',
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: Colors.primary,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIconStar: {
    marginRight: 6,
  },
  badgeIconCheck: {
    marginRight: 6,
  },
  badgeIconShield: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
