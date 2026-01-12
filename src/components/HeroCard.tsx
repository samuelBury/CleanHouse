import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

const {width} = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

interface SlideData {
  image: any;
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
}

const slides: SlideData[] = [
  {
    image: require('../../assets/images/Image1.jpeg'),
    badge: 'Disponible 7j/7',
    badgeIcon: 'clock',
    title: 'Un ménage impeccable\nen quelques clics',
    subtitle: 'Réservez facilement, on s\'occupe du reste',
  },
  {
    image: require('../../assets/images/Image2.jpeg'),
    badge: 'Professionnels certifiés',
    badgeIcon: 'shield-alt',
    title: 'Des experts du\nménage à domicile',
    subtitle: 'Personnel formé, vérifié et assuré',
  },
  {
    image: require('../../assets/images/Image3.jpeg'),
    badge: 'Satisfaction garantie',
    badgeIcon: 'heart',
    title: 'Votre confort,\nnotre priorité',
    subtitle: 'Service 5 étoiles ou remboursé',
  },
];

export default function HeroCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + 10), // +10 for gap
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + 10)); // +10 for gap
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 10}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.heroCard}>
            <Image source={slide.image} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <View style={styles.availableBadge}>
                <FontAwesome5
                  name={slide.badgeIcon}
                  size={12}
                  color="#FFD700"
                  solid
                  style={styles.availableBadgeIcon}
                />
                <Text style={styles.availableBadgeText}>{slide.badge}</Text>
              </View>
              <Text style={styles.heroTitle}>{slide.title}</Text>
              <Text style={styles.heroSubtext}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    marginRight: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },
  availableBadgeIcon: {
    marginRight: 6,
  },
  availableBadgeText: {
    color: Colors.text.inverse,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.medium,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});
