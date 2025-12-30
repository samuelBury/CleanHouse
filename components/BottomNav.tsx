import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface BottomNavProps {
  activeTab?: 'home' | 'search' | 'agenda' | 'profile' | 'wallet' | 'history';
  onHomePress?: () => void;
  onAgendaPress?: () => void;
  onProfilePress?: () => void;
}

export default function BottomNav({activeTab = 'home', onHomePress, onAgendaPress, onProfilePress}: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
        <Text style={activeTab === 'home' ? styles.navIconActive : styles.navIcon}>🏠</Text>
        <Text style={activeTab === 'home' ? styles.navTextActive : styles.navText}>Accueil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Text style={activeTab === 'search' ? styles.navIconActive : styles.navIcon}>🔍</Text>
        <Text style={activeTab === 'search' ? styles.navTextActive : styles.navText}>Recherche</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItemCenter}>
        <View style={styles.centerButton}>
          <Text style={styles.centerButtonIcon}>+</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onAgendaPress}>
        <Text style={activeTab === 'agenda' ? styles.navIconActive : styles.navIcon}>📅</Text>
        <Text style={activeTab === 'agenda' ? styles.navTextActive : styles.navText}>Agenda</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onProfilePress}>
        <Text style={activeTab === 'profile' ? styles.navIconActive : styles.navIcon}>👤</Text>
        <Text style={activeTab === 'profile' ? styles.navTextActive : styles.navText}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    fontSize: 20,
    marginBottom: 4,
    color: '#789C8D',
  },
  navText: {
    fontSize: 10,
    color: '#999',
  },
  navTextActive: {
    fontSize: 10,
    color: '#789C8D',
    fontWeight: '600',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#789C8D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  centerButtonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
