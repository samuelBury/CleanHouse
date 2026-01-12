import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

interface HeaderProps {
  userName: string;
  onProfilePress: () => void;
  onNotificationPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function Header({
  userName,
  onNotificationPress,
  hasUnreadNotifications = false,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greetingText}>BONJOUR</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
        {hasUnreadNotifications && <View style={styles.notificationDot} />}
        <FontAwesome5 name="bell" size={22} color={Colors.secondary} solid />
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
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  greetingText: {
    fontSize: 12,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.warning,
    zIndex: 1,
  },
});
