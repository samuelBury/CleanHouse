import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, Modal, Easing, TouchableOpacity} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

interface SearchingProfessionalProps {
  visible: boolean;
  onCancel?: () => void;
}

export default function SearchingProfessional({visible, onCancel}: SearchingProfessionalProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const ping1Scale = useRef(new Animated.Value(1)).current;
  const ping1Opacity = useRef(new Animated.Value(0.4)).current;
  const ping2Scale = useRef(new Animated.Value(1)).current;
  const ping2Opacity = useRef(new Animated.Value(0.4)).current;
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!visible) return;

    // Rotation continue de l'icône
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Pulsation du cercle principal
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Premier anneau ping
    const pingLoop1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ping1Scale, {
            toValue: 2.5,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ping1Opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ping1Scale, {toValue: 1, duration: 0, useNativeDriver: true}),
          Animated.timing(ping1Opacity, {toValue: 0.4, duration: 0, useNativeDriver: true}),
        ]),
      ])
    );
    pingLoop1.start();

    // Deuxième anneau ping (décalé)
    const ping2Timeout = setTimeout(() => {
      const pingLoop2 = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ping2Scale, {
              toValue: 2.5,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ping2Opacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ping2Scale, {toValue: 1, duration: 0, useNativeDriver: true}),
            Animated.timing(ping2Opacity, {toValue: 0.4, duration: 0, useNativeDriver: true}),
          ]),
        ])
      );
      pingLoop2.start();
    }, 900);

    // Animation des points avec setInterval
    let dotCount = 0;
    const dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setDots('.'.repeat(dotCount));
    }, 500);

    return () => {
      spin.stop();
      pulse.stop();
      pingLoop1.stop();
      clearTimeout(ping2Timeout);
      clearInterval(dotsInterval);
      spinAnim.setValue(0);
      pulseScale.setValue(1);
      ping1Scale.setValue(1);
      ping1Opacity.setValue(0.4);
      ping2Scale.setValue(1);
      ping2Opacity.setValue(0.4);
    };
  }, [visible]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Zone d'animation */}
          <View style={styles.animationZone}>
            {/* Anneaux ping */}
            <Animated.View
              style={[
                styles.pingRing,
                {transform: [{scale: ping1Scale}], opacity: ping1Opacity},
              ]}
            />
            <Animated.View
              style={[
                styles.pingRing,
                {transform: [{scale: ping2Scale}], opacity: ping2Opacity},
              ]}
            />

            {/* Cercle principal avec pulsation */}
            <Animated.View style={[styles.mainCircle, {transform: [{scale: pulseScale}]}]}>
              {/* Icône qui tourne */}
              <Animated.View style={{transform: [{rotate: spin}]}}>
                <FontAwesome5 name="search" size={36} color="#fff" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Textes */}
          <Text style={styles.title}>Recherche en cours</Text>
          <Text style={styles.subtitle}>
            Nous recherchons une femme de ménage{'\n'}disponible près de chez vous
          </Text>

          {/* Indicateur animé */}
          <View style={styles.dotsContainer}>
            <Text style={styles.dotsText}>{dots}</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <FontAwesome5 name="info-circle" size={14} color={Colors.primary} />
            <Text style={styles.infoText}>
              Vous serez notifié dès qu'un professionnel accepte votre demande
            </Text>
          </View>

          {/* Bouton Annuler */}
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: Colors.background.primary,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 30,
    marginHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  animationZone: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  mainCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dotsContainer: {
    height: 24,
    marginBottom: 20,
  },
  dotsText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
