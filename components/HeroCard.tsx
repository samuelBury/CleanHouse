import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

export default function HeroCard() {
  return (
    <View style={styles.heroCard}>
      <Image
        source={require('../assets/images/Image1.jpeg')}
        style={styles.heroImage}
      />
      <View style={styles.heroOverlay}>
        <View style={styles.availableBadge}>
          <Text style={styles.availableBadgeText}>⭐ Disponible maintenant</Text>
        </View>
        <Text style={styles.heroTitle}>Votre maison mérite{'\n'}le meilleur soin</Text>
        <Text style={styles.heroSubtext}>Réservez en 2 minutes - profitez toute la semaine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 15,
  },
  availableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#c5f2d8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },
  availableBadgeText: {
    color: '#2D5F4A',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtext: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
});
