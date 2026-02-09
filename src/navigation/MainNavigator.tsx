// Navigation principale avec tabs
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { Colors } from '../config/theme';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom floating tab bar with gradient
const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const icons: Record<string, string> = {
    Home: 'home',
    History: 'clipboard-list',
    Profile: 'user',
  };

  return (
    <>
      {/* Gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.7)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Floating buttons */}
      <View style={styles.floatingContainer}>
        {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.floatingButton, isFocused && styles.floatingButtonActive]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name={icons[route.name]}
              size={isFocused ? 20 : 18}
              color={isFocused ? Colors.text.inverse : Colors.text.secondary}
              solid
            />
          </TouchableOpacity>
        );
      })}
      </View>
    </>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  floatingButtonActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 15,
  },
});

export default MainNavigator;
