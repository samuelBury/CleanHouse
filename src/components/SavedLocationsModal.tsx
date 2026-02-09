import React, {useState, useEffect} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors, Spacing, BorderRadius, Typography} from '../config/theme';
import AddressAutocomplete from './AddressAutocomplete';
import {AddressSuggestion} from '../services/addressService';

const SAVED_LOCATIONS_KEY = '@cleanhouse_saved_locations';
const HOME_ADDRESS_KEY = '@cleanhouse_home_address';

interface SavedLocation {
  id: string;
  name: string;
  address: AddressSuggestion;
  createdAt: number;
}

interface SavedLocationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SavedLocationsModal({
  visible,
  onClose,
}: SavedLocationsModalProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [homeAddress, setHomeAddress] = useState<AddressSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);

  // Form states
  const [locationName, setLocationName] = useState('');
  const [addressText, setAddressText] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedLocs, savedHome] = await Promise.all([
        AsyncStorage.getItem(SAVED_LOCATIONS_KEY),
        AsyncStorage.getItem(HOME_ADDRESS_KEY),
      ]);
      if (savedLocs) {
        setLocations(JSON.parse(savedLocs));
      }
      if (savedHome) {
        setHomeAddress(JSON.parse(savedHome));
      }
    } catch (error) {
      console.log('Error loading locations:', error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setLocationName('');
    setAddressText('');
    setSelectedAddress(null);
    setShowAddForm(false);
    setEditingLocation(null);
  };

  const handleAddLocation = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditLocation = (location: SavedLocation) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setAddressText(location.address.label);
    setSelectedAddress(location.address);
    setShowAddForm(true);
  };

  const handleSaveLocation = async () => {
    if (!locationName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour ce lieu');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse');
      return;
    }

    try {
      let updatedLocations: SavedLocation[];

      if (editingLocation) {
        // Update existing
        updatedLocations = locations.map(loc =>
          loc.id === editingLocation.id
            ? {...loc, name: locationName.trim(), address: selectedAddress}
            : loc
        );
      } else {
        // Add new
        const newLocation: SavedLocation = {
          id: Date.now().toString(),
          name: locationName.trim(),
          address: selectedAddress,
          createdAt: Date.now(),
        };
        updatedLocations = [...locations, newLocation];
      }

      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      setLocations(updatedLocations);
      resetForm();
      Alert.alert('Succès', editingLocation ? 'Lieu modifié' : 'Lieu ajouté');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le lieu');
    }
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${location.name}" ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedLocations = locations.filter(loc => loc.id !== location.id);
              await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updatedLocations));
              setLocations(updatedLocations);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le lieu');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHome = () => {
    Alert.alert(
      'Supprimer',
      'Supprimer l\'adresse de domicile ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(HOME_ADDRESS_KEY);
              setHomeAddress(null);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
          <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.header}>
            <Text style={styles.headerTitle}>Lieux enregistrés</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : showAddForm ? (
              // Add/Edit Form
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {editingLocation ? 'Modifier le lieu' : 'Ajouter un lieu'}
                </Text>

                <Text style={styles.inputLabel}>Nom du lieu</Text>
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="Ex: Bureau, Parents, Salle de sport..."
                  placeholderTextColor={Colors.text.tertiary}
                />

                <Text style={styles.inputLabel}>Adresse</Text>
                <AddressAutocomplete
                  value={addressText}
                  onChangeText={setAddressText}
                  onSelectAddress={setSelectedAddress}
                  placeholder="Rechercher une adresse..."
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={resetForm}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButtonContainer,
                      (!locationName.trim() || !selectedAddress) && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveLocation}
                    disabled={!locationName.trim() || !selectedAddress}
                  >
                    <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.saveButton}>
                      <Text style={styles.saveButtonText}>
                        {editingLocation ? 'Modifier' : 'Ajouter'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Locations List
              <>
                {/* Home Address */}
                {homeAddress && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Domicile</Text>
                    <View style={styles.locationItem}>
                      <View style={styles.locationIconContainer}>
                        <FontAwesome5 name="home" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>Mon domicile</Text>
                        <Text style={styles.locationAddress} numberOfLines={2}>
                          {homeAddress.label}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteHome}
                      >
                        <FontAwesome5 name="trash-alt" size={14} color={Colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Other Locations */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Autres lieux</Text>
                    <TouchableOpacity
                      style={styles.addButtonContainer}
                      onPress={handleAddLocation}
                    >
                      <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.addButton}>
                        <Text style={styles.addButtonText}>+ Ajouter</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {locations.length === 0 ? (
                    <View style={styles.emptyState}>
                      <FontAwesome5 name="map-marker-alt" size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                      <Text style={styles.emptyText}>Aucun lieu enregistré</Text>
                      <Text style={styles.emptySubtext}>
                        Ajoutez des lieux pour les retrouver facilement lors de vos réservations
                      </Text>
                    </View>
                  ) : (
                    locations.map((location) => (
                      <View key={location.id} style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                          <FontAwesome5 name="map-marker-alt" size={20} color={Colors.primary} />
                        </View>
                        <TouchableOpacity
                          style={styles.locationInfo}
                          onPress={() => handleEditLocation(location)}
                        >
                          <Text style={styles.locationName}>{location.name}</Text>
                          <Text style={styles.locationAddress} numberOfLines={2}>
                            {location.address.label}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditLocation(location)}
                        >
                          <FontAwesome5 name="pen" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteLocation(location)}
                        >
                          <FontAwesome5 name="trash-alt" size={14} color={Colors.status.error} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  addButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.text.inverse,
    fontSize: 13,
    fontWeight: '600',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIcon: {
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editButtonText: {
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.status.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Form styles
  form: {
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
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
  formButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  saveButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  saveButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  saveButtonText: {
    fontSize: 15,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
});
