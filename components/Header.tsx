import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greetingText}>BONJOUR</Text>
        <Text style={styles.userName}>Chantal 👋</Text>
      </View>
      <TouchableOpacity style={styles.notificationButton}>
        <View style={styles.notificationDot} />
        <Text style={styles.notificationIcon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  greetingText: {
    fontSize: 12,
    color: '#999',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    zIndex: 1,
  },
});
