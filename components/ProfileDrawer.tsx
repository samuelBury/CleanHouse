import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Switch,
} from 'react-native';

const {width} = Dimensions.get('window');

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onWalletPress: () => void;
  onHistoryPress: () => void;
}

export default function ProfileDrawer({visible, onClose, onWalletPress, onHistoryPress}: ProfileDrawerProps) {
  const [isAvailable, setIsAvailable] = React.useState(true);

  const menuItems = [
    {icon: '🏠', label: 'Accueil', active: true, action: 'home'},
    {icon: '💳', label: 'Mon Portefeuille', action: 'wallet'},
    {icon: '📋', label: 'Historique', action: 'history'},
    {icon: '👥', label: 'Inviter des amis', action: 'invite'},
    {icon: '⚙️', label: 'Paramètres', action: 'settings'},
    {icon: '🚪', label: 'Déconnexion', danger: true, action: 'logout'},
  ];

  const handleMenuPress = (action: string) => {
    if (action === 'home') {
      onClose();
    } else if (action === 'wallet') {
      onClose();
      onWalletPress();
    } else if (action === 'history') {
      onClose();
      onHistoryPress();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Drawer Content */}
        <View style={styles.drawer}>
          {/* Header vert avec profil */}
          <View style={styles.header}>
            {/* Toggle disponibilité */}
            <View style={styles.toggleContainer}>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{false: '#ccc', true: '#fff'}}
                thumbColor={isAvailable ? '#5FB17C' : '#f4f3f4'}
                style={styles.toggle}
              />
            </View>

            {/* Photo de profil */}
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileInitials}>JD</Text>
              </View>
            </View>

            {/* Nom et badge */}
            <Text style={styles.profileName}>Jean Dupont</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>⭐</Text>
              <Text style={styles.badgeText}>Gold member</Text>
            </View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statValue}>10.2</Text>
                <Text style={styles.statLabel}>Heures réservées</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>✨</Text>
                <Text style={styles.statValue}>20</Text>
                <Text style={styles.statLabel}>Prestations</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.menuLabel,
                    item.active && styles.menuLabelActive,
                    item.danger && styles.menuLabelDanger,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    backgroundColor: '#d4a59a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomRightRadius: 30,
  },
  toggleContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  toggle: {
    transform: [{scaleX: 0.9}, {scaleY: 0.9}],
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d4a59a',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 4,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#d4a59a',
    fontWeight: '600',
  },
  menuLabelDanger: {
    color: '#e74c3c',
  },
});
