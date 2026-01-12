import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

interface ServicesSectionProps {
  onServiceSelect: (service: string) => void;
}

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
          {/* Barre blanche en bas */}
          <View style={styles.whiteBar}>
            <View style={styles.serviceInfo}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="home" size={14} color={Colors.primary} solid />
              </View>
              <View>
                <Text style={styles.serviceTitle}>Ménage</Text>
                <Text style={styles.serviceSubtitle}>Nettoyage{'\n'}complet</Text>
              </View>
            </View>
            <View style={styles.arrowButton}>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.text.inverse} />
            </View>
          </View>
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
          {/* Barre blanche en bas */}
          <View style={styles.whiteBar}>
            <View style={styles.serviceInfo}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="tshirt" size={14} color={Colors.primary} solid />
              </View>
              <View>
                <Text style={styles.serviceTitle}>Repassage</Text>
                <Text style={styles.serviceSubtitle}>Vêtements impeccables</Text>
              </View>
            </View>
            <View style={styles.arrowButton}>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.text.inverse} />
            </View>
          </View>
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
        {/* Barre blanche en bas */}
        <View style={styles.whiteBarFull}>
          <View style={styles.serviceInfo}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="magic" size={14} color={Colors.primary} solid />
            </View>
            <View>
              <Text style={styles.serviceTitle}>Ménage & Repassage</Text>
              <Text style={styles.serviceSubtitle}>Pack complet économique</Text>
            </View>
          </View>
          <View style={styles.arrowButton}>
            <FontAwesome5 name="chevron-right" size={10} color={Colors.text.inverse} />
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
  whiteBar: {
    backgroundColor: Colors.background.primary,
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
  serviceSubtitle: {
    color: Colors.text.tertiary,
    fontSize: 11,
    marginTop: 1,
  },
  arrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
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
  whiteBarFull: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
