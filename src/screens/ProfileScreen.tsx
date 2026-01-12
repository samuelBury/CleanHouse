// Écran Profil
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../config/theme';
import PaymentMethodsModal from '../components/PaymentMethodsModal';
import SavedLocationsModal from '../components/SavedLocationsModal';
import SecurityModal from '../components/SecurityModal';
import HelpSupportModal from '../components/HelpSupportModal';
import TermsModal from '../components/TermsModal';

const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { bookings } = useBooking();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  // Calculate stats
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalHours = completedBookings.reduce((acc, b) => acc + b.duration, 0);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone.trim() });
      setShowEditModal(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const menuItems = [
    { icon: 'credit-card', title: 'Moyens de paiement', onPress: () => setShowPaymentMethods(true) },
    { icon: 'map-marker-alt', title: 'Lieux enregistrés', onPress: () => setShowSavedLocations(true) },
    { icon: 'lock', title: 'Sécurité', onPress: () => setShowSecurity(true) },
    { icon: 'question-circle', title: 'Aide et support', onPress: () => setShowHelpSupport(true) },
    { icon: 'file-alt', title: 'Conditions d\'utilisation', onPress: () => setShowTerms(true) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            {user?.phone && (
              <Text style={styles.profilePhone}>{user.phone}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleOpenEdit}>
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Total heures</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <FontAwesome5 name={item.icon} size={18} color={Colors.primary} solid />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <FontAwesome5 name="chevron-right" size={14} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome5 name="sign-out-alt" size={18} color={Colors.status.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>

            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Votre nom"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Votre téléphone"
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <PaymentMethodsModal
        visible={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
      />

      {/* Saved Locations Modal */}
      <SavedLocationsModal
        visible={showSavedLocations}
        onClose={() => setShowSavedLocations(false)}
      />

      {/* Security Modal */}
      <SecurityModal
        visible={showSecurity}
        onClose={() => setShowSecurity(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        visible={showHelpSupport}
        onClose={() => setShowHelpSupport(false)}
      />

      {/* Terms Modal */}
      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
  },
  profileCard: {
    backgroundColor: Colors.background.primary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: Typography.sizes.md,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
  },
  editButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  statsContainer: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border.light,
  },
  menuContainer: {
    backgroundColor: Colors.background.primary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'Colors.primaryBackground',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
  },
  logoutButton: {
    backgroundColor: Colors.background.primary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  logoutIcon: {
    marginRight: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.sizes.lg,
    color: Colors.status.error,
    fontWeight: Typography.weights.medium,
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.medium,
  },
});

export default ProfileScreen;
