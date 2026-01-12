import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors, Spacing, BorderRadius, Typography} from '../config/theme';
import {useAuth} from '../context/AuthContext';

interface SecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityModal({
  visible,
  onClose,
}: SecurityModalProps) {
  const {user, changePassword, deleteAccount, logout} = useAuth();

  const [currentView, setCurrentView] = useState<'menu' | 'password' | 'delete'>('menu');
  const [loading, setLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès');
        resetPasswordForm();
        setCurrentView('menu');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de changer le mot de passe');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }
    if (deleteConfirmText !== 'SUPPRIMER') {
      Alert.alert('Erreur', 'Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    Alert.alert(
      'Dernière confirmation',
      'Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteAccount(deletePassword);
              if (result.success) {
                Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès');
                onClose();
                logout();
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de supprimer le compte');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const resetDeleteForm = () => {
    setDeletePassword('');
    setDeleteConfirmText('');
  };

  const handleClose = () => {
    setCurrentView('menu');
    resetPasswordForm();
    resetDeleteForm();
    onClose();
  };

  const handleBack = () => {
    setCurrentView('menu');
    resetPasswordForm();
    resetDeleteForm();
  };

  const renderMenu = () => (
    <>
      {/* Change Password */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentView('password')}
      >
        <View style={styles.menuItemLeft}>
          <FontAwesome5 name="key" size={24} color={Colors.text.primary} style={styles.menuIcon} />
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>Changer le mot de passe</Text>
            <Text style={styles.menuItemSubtitle}>
              Modifier votre mot de passe actuel
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={18} color={Colors.text.tertiary} style={styles.menuArrow} />
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemDanger]}
        onPress={() => setCurrentView('delete')}
      >
        <View style={styles.menuItemLeft}>
          <FontAwesome5 name="trash-alt" size={24} color={Colors.status.error} style={styles.menuIcon} />
          <View style={styles.menuItemInfo}>
            <Text style={[styles.menuItemTitle, styles.dangerText]}>
              Supprimer le compte
            </Text>
            <Text style={styles.menuItemSubtitle}>
              Suppression définitive de votre compte
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={18} color={Colors.text.tertiary} style={styles.menuArrow} />
      </TouchableOpacity>
    </>
  );

  const renderPasswordForm = () => (
    <View style={styles.form}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <FontAwesome5 name="arrow-left" size={14} color={Colors.primary} style={{marginRight: 6}} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>Changer le mot de passe</Text>

      <Text style={styles.inputLabel}>Mot de passe actuel</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Entrez votre mot de passe actuel"
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Min 8 car., 1 majuscule, 1 chiffre"
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Retapez le nouveau mot de passe"
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!currentPassword || !newPassword || !confirmPassword) && styles.submitButtonDisabled,
        ]}
        onPress={handleChangePassword}
        disabled={loading || !currentPassword || !newPassword || !confirmPassword}
      >
        {loading ? (
          <ActivityIndicator color={Colors.text.inverse} />
        ) : (
          <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDeleteForm = () => (
    <View style={styles.form}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <FontAwesome5 name="arrow-left" size={14} color={Colors.primary} style={{marginRight: 6}} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.dangerHeader}>
        <FontAwesome5 name="exclamation-triangle" size={48} color={Colors.status.error} style={styles.dangerIcon} />
        <Text style={styles.dangerTitle}>Supprimer le compte</Text>
      </View>

      <Text style={styles.dangerDescription}>
        Cette action est irréversible. Toutes vos données seront définitivement supprimées :
      </Text>

      <View style={styles.dangerList}>
        <Text style={styles.dangerListItem}>• Historique des réservations</Text>
        <Text style={styles.dangerListItem}>• Moyens de paiement enregistrés</Text>
        <Text style={styles.dangerListItem}>• Lieux enregistrés</Text>
        <Text style={styles.dangerListItem}>• Toutes vos préférences</Text>
      </View>

      <Text style={styles.inputLabel}>Mot de passe</Text>
      <TextInput
        style={styles.input}
        value={deletePassword}
        onChangeText={setDeletePassword}
        placeholder="Entrez votre mot de passe"
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>
        Tapez SUPPRIMER pour confirmer
      </Text>
      <TextInput
        style={styles.input}
        value={deleteConfirmText}
        onChangeText={setDeleteConfirmText}
        placeholder="SUPPRIMER"
        placeholderTextColor={Colors.text.tertiary}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={[
          styles.deleteButton,
          (deleteConfirmText !== 'SUPPRIMER' || !deletePassword) && styles.deleteButtonDisabled,
        ]}
        onPress={handleDeleteAccount}
        disabled={loading || deleteConfirmText !== 'SUPPRIMER' || !deletePassword}
      >
        {loading ? (
          <ActivityIndicator color={Colors.text.inverse} />
        ) : (
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sécurité</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentView === 'menu' && renderMenu()}
            {currentView === 'password' && renderPasswordForm()}
            {currentView === 'delete' && renderDeleteForm()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.text.inverse,
  },
  content: {
    padding: 20,
  },
  // Menu styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemDanger: {
    borderWidth: 1,
    borderColor: Colors.status.error + '30',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  menuArrow: {
  },
  dangerText: {
    color: Colors.status.error,
  },
  // Form styles
  form: {
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  // Delete styles
  dangerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dangerIcon: {
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.status.error,
  },
  dangerDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerList: {
    backgroundColor: Colors.status.error + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  dangerListItem: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: Colors.status.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
