import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';

interface ServicesSectionProps {
  onServicePress: (service: string) => void;
}

export default function ServicesSection({onServicePress}: ServicesSectionProps) {
  return (
    <View style={styles.servicesSection}>
      <Text style={styles.sectionTitle}>Nos services</Text>
      <View style={styles.servicesGrid}>
        <TouchableOpacity style={styles.serviceCard} onPress={() => onServicePress('Ménage')}>
          <Image
            source={require('../assets/images/Image3.jpeg')}
            style={styles.serviceImage}
          />
          <View style={styles.menageOverlay}>
            <Text style={styles.servicePrice}>15€/h</Text>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceIcon}>🏠</Text>
              <Text style={styles.serviceTitle}>Ménage</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.serviceCard} onPress={() => onServicePress('Repassage')}>
          <Image
            source={require('../assets/images/Image2.jpeg')}
            style={styles.serviceImage}
          />
          <View style={styles.repassageOverlay}>
            <Text style={styles.servicePrice}>10€/h</Text>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceIcon}>👔</Text>
              <Text style={styles.serviceTitle}>Repassage</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fullServiceCard} onPress={() => onServicePress('Ménage & Repassage')}>
        <Image
          source={{uri: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800'}}
          style={styles.fullServiceImage}
        />
        <View style={styles.fullServiceOverlay}>
          <Text style={styles.fullServicePrice}>20€/h</Text>
          <View style={styles.fullServiceInfo}>
            <Text style={styles.fullServiceIcon}>✨</Text>
            <Text style={styles.fullServiceTitle}>Ménage & Repassage</Text>
          </View>
        </View>
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
    color: '#333',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  menageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6B352040',
    padding: 12,
    justifyContent: 'flex-end',
  },
  repassageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#C5F2D840',
    padding: 12,
    justifyContent: 'flex-end',
  },
  servicePrice: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 6,
  },
  serviceTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullServiceCard: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullServiceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fullServiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullServicePrice: {
    position: 'absolute',
    top: 8,
    right: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullServiceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fullServiceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
