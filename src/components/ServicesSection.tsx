import React, {useEffect, useRef} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Animated, Easing} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors} from '../config/theme';

interface ServicesSectionProps {
  onServiceSelect: (service: string) => void;
}

// Composant pour le dégradé animé horizontalement
const AnimatedGradientBar = ({children, style}: {children: React.ReactNode; style?: any}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  // Dégradé seamless - le pattern se répète tous les 300px, translation = 300px
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -300],
  });

  return (
    <View style={[style, {overflow: 'hidden'}]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 900,
          transform: [{translateX}],
        }}
      >
        <LinearGradient
          colors={[
            Colors.gradient[0],
            Colors.gradient[1],
            Colors.gradient[2],
            Colors.gradient[0],
            Colors.gradient[1],
            Colors.gradient[2],
            Colors.gradient[0],
            Colors.gradient[1],
            Colors.gradient[2],
            Colors.gradient[0],
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          locations={[0, 1/9, 2/9, 3/9, 4/9, 5/9, 6/9, 7/9, 8/9, 1]}
          style={{flex: 1}}
        />
      </Animated.View>
      <View style={styles.gradientContent}>{children}</View>
    </View>
  );
};

export default function ServicesSection({onServiceSelect}: ServicesSectionProps) {
  return (
    <View style={styles.servicesSection}>
      <Text style={styles.sectionTitle}>Nos services</Text>

      <View style={styles.servicesGrid}>
        {/* Carte Ménage */}
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onServiceSelect('Ménage')}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/Image3.jpeg')}
              style={styles.serviceImage}
            />
            {/* Badge prix */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>15€/h</Text>
            </View>
          </View>
          {/* Barre dégradée animée en bas */}
          <AnimatedGradientBar style={styles.gradientBar}>
            <View style={styles.serviceInfo}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="home" size={14} color={Colors.primary} solid />
              </View>
              <View>
                <Text style={styles.serviceTitleWhite}>Ménage</Text>
                <Text style={styles.serviceSubtitleWhite}>Nettoyage{'\n'}complet</Text>
              </View>
            </View>
            <View style={styles.arrowButtonWhite}>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.primary} />
            </View>
          </AnimatedGradientBar>
        </TouchableOpacity>

        {/* Carte Repassage */}
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onServiceSelect('Repassage')}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/Image2.jpeg')}
              style={styles.serviceImage}
            />
            {/* Badge prix */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>10€/h</Text>
            </View>
          </View>
          {/* Barre dégradée animée en bas */}
          <AnimatedGradientBar style={styles.gradientBar}>
            <View style={styles.serviceInfo}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="tshirt" size={14} color={Colors.primary} solid />
              </View>
              <View>
                <Text style={styles.serviceTitleWhite}>Repassage</Text>
                <Text style={styles.serviceSubtitleWhite}>Vêtements impeccables</Text>
              </View>
            </View>
            <View style={styles.arrowButtonWhite}>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.primary} />
            </View>
          </AnimatedGradientBar>
        </TouchableOpacity>
      </View>

      {/* Carte Ménage + Repassage */}
      <TouchableOpacity
        style={styles.fullServiceCard}
        onPress={() => onServiceSelect('Ménage + Repassage')}
        activeOpacity={0.9}
      >
        <View style={styles.fullImageContainer}>
          <Image
            source={{uri: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800'}}
            style={styles.fullServiceImage}
          />
          {/* Badge prix */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>20€/h</Text>
          </View>
        </View>
        {/* Barre dégradée animée en bas */}
        <AnimatedGradientBar style={styles.gradientBarFull}>
          <View style={styles.serviceInfo}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="magic" size={14} color={Colors.primary} solid />
            </View>
            <View>
              <Text style={styles.serviceTitleWhite}>Ménage & Repassage</Text>
              <Text style={styles.serviceSubtitleWhite}>Pack complet économique</Text>
            </View>
          </View>
          <View style={styles.arrowButtonWhite}>
            <FontAwesome5 name="chevron-right" size={10} color={Colors.primary} />
          </View>
        </AnimatedGradientBar>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  servicesSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 100,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceBadgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  gradientBar: {
    height: 65,
    overflow: 'hidden',
  },
  gradientContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  serviceTitleWhite: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  serviceSubtitle: {
    color: Colors.text.tertiary,
    fontSize: 11,
    marginTop: 1,
  },
  serviceSubtitleWhite: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  arrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonWhite: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullServiceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullImageContainer: {
    height: 100,
    position: 'relative',
  },
  fullServiceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientBarFull: {
    height: 55,
    overflow: 'hidden',
  },
});
