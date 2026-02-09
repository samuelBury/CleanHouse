import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {Colors} from '../config/theme';
import AddressAutocomplete from './AddressAutocomplete';
import {AddressSuggestion, addressService} from '../services/addressService';

const HOME_ADDRESS_KEY = '@cleanhouse_home_address';
const INSTRUCTIONS_KEY = '@cleanhouse_instructions';
const SAVED_LOCATIONS_KEY = '@cleanhouse_saved_locations';

interface SavedLocation {
  id: string;
  name: string;
  address: AddressSuggestion;
  createdAt: number;
}

export interface BookingData {
  date: string;
  time: string;
  duration: number;
  address: string;
  latitude?: number;
  longitude?: number;
  isIndeterminate: boolean;
  meetingPoint: 'downstairs' | 'door';
  instructions?: string;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: BookingData) => void;
  service: string;
}

export default function BookingModal({visible, onClose, onConfirm, service}: BookingModalProps) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<'downstairs' | 'door'>('door');
  const [instructions, setInstructions] = useState('');
  const [saveAsHome, setSaveAsHome] = useState(false);
  const [savedHomeAddress, setSavedHomeAddress] = useState<AddressSuggestion | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [saveLocation, setSaveLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Charger l'adresse de domicile, les instructions et les localisations enregistrées
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedAddress, savedInstructions, savedLocs] = await Promise.all([
          AsyncStorage.getItem(HOME_ADDRESS_KEY),
          AsyncStorage.getItem(INSTRUCTIONS_KEY),
          AsyncStorage.getItem(SAVED_LOCATIONS_KEY),
        ]);
        if (savedAddress) {
          setSavedHomeAddress(JSON.parse(savedAddress));
        }
        if (savedInstructions) {
          setInstructions(savedInstructions);
        }
        if (savedLocs) {
          setSavedLocations(JSON.parse(savedLocs));
        }
      } catch (error) {
        // Ignorer les erreurs de chargement
      }
    };
    loadSavedData();
  }, []);

  // Sauvegarder l'adresse comme domicile
  const saveHomeAddress = async (addressData: AddressSuggestion) => {
    try {
      await AsyncStorage.setItem(HOME_ADDRESS_KEY, JSON.stringify(addressData));
      setSavedHomeAddress(addressData);
      Alert.alert('Succès', 'Adresse enregistrée comme domicile');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'adresse');
    }
  };

  // Utiliser l'adresse de domicile enregistrée
  const useHomeAddress = () => {
    if (savedHomeAddress) {
      setAddress(savedHomeAddress.label);
      setSelectedAddress(savedHomeAddress);
    }
  };

  // Sauvegarder une nouvelle localisation
  const saveNewLocation = async (name: string, addressData: AddressSuggestion) => {
    try {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        name,
        address: addressData,
        createdAt: Date.now(),
      };
      const updatedLocations = [...savedLocations, newLocation];
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      setSavedLocations(updatedLocations);
      Alert.alert('Succès', `"${name}" a été enregistré`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le lieu');
    }
  };

  // Supprimer une localisation
  const deleteLocation = async (locationId: string) => {
    try {
      const updatedLocations = savedLocations.filter(loc => loc.id !== locationId);
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      setSavedLocations(updatedLocations);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer le lieu');
    }
  };

  // Utiliser une localisation sauvegardée
  const useLocation = (location: SavedLocation) => {
    setAddress(location.address.label);
    setSelectedAddress(location.address);
    setShowLocationPicker(false);
  };

  // Obtenir l'adresse depuis la position actuelle
  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à la localisation dans les paramètres de votre téléphone.'
        );
        setLoadingLocation(false);
        return;
      }

      // Essayer d'abord la dernière position connue (instantané)
      let location = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // Position de moins d'1 minute
      });

      // Sinon, obtenir la position actuelle
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      // Reverse geocoding pour obtenir l'adresse
      const addressResult = await addressService.reverse(
        location.coords.latitude,
        location.coords.longitude
      );

      if (addressResult) {
        setAddress(addressResult.label);
        setSelectedAddress(addressResult);
      } else {
        Alert.alert('Erreur', 'Impossible de trouver l\'adresse pour cette position.');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    // Vérifier que la réservation est au moins 1 heure à l'avance
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 heure

    if (bookingDateTime < minBookingTime) {
      Alert.alert(
        'Réservation impossible',
        'La prestation doit être réservée au moins 1 heure à l\'avance.',
        [{text: 'Compris'}]
      );
      return;
    }

    // Sauvegarder comme domicile si demandé
    if (saveAsHome && selectedAddress) {
      saveHomeAddress(selectedAddress);
    }

    // Sauvegarder comme lieu si demandé
    if (saveLocation && selectedAddress && locationName.trim()) {
      saveNewLocation(locationName.trim(), selectedAddress);
      setSaveLocation(false);
      setLocationName('');
    }

    // Sauvegarder les instructions
    if (instructions.trim()) {
      AsyncStorage.setItem(INSTRUCTIONS_KEY, instructions.trim());
    }

    // Passer les données au parent
    onConfirm({
      date: formatDate(date),
      time: formatTime(time),
      duration: duration || 0,
      address: address,
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
      isIndeterminate: duration === null,
      meetingPoint,
      instructions: instructions.trim() || undefined,
    });
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <FontAwesome5
                name={service === 'Ménage' ? 'home' : service === 'Repassage' ? 'tshirt' : 'magic'}
                size={18}
                color={Colors.text.inverse}
                solid
              />
            </View>
            <View style={styles.modalHeaderTitleContainer}>
              <Text style={styles.modalHeaderTitle}>{service}</Text>
              <Text style={styles.modalHeaderPrice}>
                {service === 'Ménage' ? '15€/h' : service === 'Repassage' ? '10€/h' : '20€/h'}
              </Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Form Fields */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            {/* Adresse */}
            <View style={[styles.formGroup, styles.addressGroup]}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="map-marker-alt" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Adresse</Text>
              </View>
              <View style={styles.addressButtonsRow}>
                <Pressable
                  style={styles.currentLocationButtonContainer}
                  onPress={getCurrentLocation}
                  disabled={loadingLocation}
                >
                  <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.currentLocationButton}>
                    {loadingLocation ? (
                      <ActivityIndicator size="small" color={Colors.text.inverse} />
                    ) : (
                      <>
                        <FontAwesome5 name="crosshairs" size={12} color={Colors.text.inverse} />
                        <Text style={styles.currentLocationButtonText}>Ma position</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.myLocationsButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <FontAwesome5 name="map-marker-alt" size={12} color={Colors.primary} />
                  <Text style={styles.myLocationsButtonText}>Mes lieux</Text>
                </Pressable>
                {savedHomeAddress && (
                  <Pressable style={styles.useHomeButtonContainer} onPress={useHomeAddress}>
                    <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.useHomeButton}>
                      <FontAwesome5 name="home" size={12} color={Colors.text.inverse} />
                      <Text style={styles.useHomeButtonText}>Domicile</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
              <AddressAutocomplete
                value={address}
                onChangeText={setAddress}
                onSelectAddress={handleSelectAddress}
                placeholder="Rechercher une adresse..."
              />
              {selectedAddress && (
                <TouchableOpacity
                  style={styles.saveAsHomeContainer}
                  onPress={() => setSaveAsHome(!saveAsHome)}
                >
                  <View style={[styles.checkbox, saveAsHome && styles.checkboxChecked]}>
                    {saveAsHome && <FontAwesome5 name="check" size={12} color={Colors.text.inverse} />}
                  </View>
                  <Text style={styles.saveAsHomeText}>
                    {savedHomeAddress ? 'Modifier mon domicile' : 'Définir comme domicile'}
                  </Text>
                </TouchableOpacity>
              )}
              {selectedAddress && (
                <View style={styles.saveLocationContainer}>
                  <TouchableOpacity
                    style={styles.saveLocationCheckbox}
                    onPress={() => setSaveLocation(!saveLocation)}
                  >
                    <View style={[styles.checkbox, saveLocation && styles.checkboxChecked]}>
                      {saveLocation && <FontAwesome5 name="check" size={12} color={Colors.text.inverse} />}
                    </View>
                    <Text style={styles.saveAsHomeText}>Enregistrer ce lieu</Text>
                  </TouchableOpacity>
                  {saveLocation && (
                    <View style={styles.saveLocationInputRow}>
                      <TextInput
                        style={styles.locationNameInputFlex}
                        value={locationName}
                        onChangeText={setLocationName}
                        placeholder="Nom du lieu (ex: Bureau...)"
                        placeholderTextColor={Colors.text.tertiary}
                      />
                      <TouchableOpacity
                        style={[
                          styles.saveLocationButtonContainer,
                          !locationName.trim() && styles.saveLocationButtonDisabled,
                        ]}
                        onPress={() => {
                          if (locationName.trim() && selectedAddress) {
                            saveNewLocation(locationName.trim(), selectedAddress);
                            setSaveLocation(false);
                            setLocationName('');
                          }
                        }}
                        disabled={!locationName.trim()}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.saveLocationButton}>
                          <Text style={styles.saveLocationButtonText}>Enregistrer</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Point de rendez-vous */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="door-open" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Point de rendez-vous</Text>
              </View>
              <View style={styles.meetingPointContainer}>
                <TouchableOpacity
                  style={[
                    styles.meetingPointOption,
                    meetingPoint === 'downstairs' && styles.meetingPointOptionSelected,
                  ]}
                  onPress={() => setMeetingPoint('downstairs')}
                >
                  <Text style={[
                    styles.meetingPointText,
                    meetingPoint === 'downstairs' && styles.meetingPointTextSelected,
                  ]}>
                    À l'extérieur
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.meetingPointOption,
                    meetingPoint === 'door' && styles.meetingPointOptionSelected,
                  ]}
                  onPress={() => setMeetingPoint('door')}
                >
                  <Text style={[
                    styles.meetingPointText,
                    meetingPoint === 'door' && styles.meetingPointTextSelected,
                  ]}>
                    Devant la porte
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Instructions générales */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="sticky-note" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Instructions générales</Text>
              </View>
              <TextInput
                style={styles.instructionsInput}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Ex: Code d'entrée, étage, sonnette..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="calendar-alt" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Date</Text>
              </View>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.timeText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Heure */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="clock" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Heure</Text>
              </View>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(time)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Nombre d'heures */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <FontAwesome5 name="stopwatch" size={14} color={Colors.primary} style={styles.formLabelIcon} />
                <Text style={styles.formLabel}>Nombre d'heures</Text>
              </View>

              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  const willShow = !showDurationPicker;
                  setShowDurationPicker(willShow);
                  if (willShow) {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({animated: true});
                    }, 100);
                  }
                }}
              >
                <Text style={duration ? styles.timeText : styles.placeholderText}>
                  {duration
                    ? `${duration} heure${duration > 1 ? 's' : ''}`
                    : 'Sélectionnez la durée'}
                </Text>
              </TouchableOpacity>
              {showDurationPicker && (
                <View style={styles.durationPicker}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.durationOption,
                        duration === hours && styles.durationOptionSelected,
                      ]}
                      onPress={() => {
                        setDuration(hours);
                        setShowDurationPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.durationOptionText,
                          duration === hours && styles.durationOptionTextSelected,
                        ]}
                      >
                        {hours}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.modalConfirmButtonContainer} onPress={handleConfirm} activeOpacity={0.8}>
              <LinearGradient
                colors={Colors.gradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.modalConfirmButton}
              >
                <Text style={styles.modalConfirmButtonText}>
                  Confirmer la réservation
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{height: 20}} />
          </ScrollView>
        </View>

        {/* Location Picker Overlay */}
        {showLocationPicker && (
          <View style={styles.locationPickerOverlay}>
            <TouchableOpacity
              style={styles.locationPickerBackdrop}
              activeOpacity={1}
              onPress={() => setShowLocationPicker(false)}
            />
            <View style={styles.locationPickerContent}>
              <View style={styles.locationPickerHeader}>
                <Text style={styles.locationPickerTitle}>Mes lieux enregistrés</Text>
                <TouchableOpacity
                  style={styles.locationPickerCloseButton}
                  onPress={() => setShowLocationPicker(false)}
                >
                  <FontAwesome5 name="times" size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.locationPickerList}>
                {savedLocations.map((location) => (
                  <View key={location.id} style={styles.locationItem}>
                    <TouchableOpacity
                      style={styles.locationItemContent}
                      onPress={() => useLocation(location)}
                    >
                      <Text style={styles.locationItemName}>{location.name}</Text>
                      <Text style={styles.locationItemAddress} numberOfLines={1}>
                        {location.address.label}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.locationDeleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Supprimer',
                          `Supprimer "${location.name}" ?`,
                          [
                            {text: 'Annuler', style: 'cancel'},
                            {
                              text: 'Supprimer',
                              style: 'destructive',
                              onPress: () => deleteLocation(location.id),
                            },
                          ]
                        );
                      }}
                    >
                      <FontAwesome5 name="trash-alt" size={14} color={Colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {savedLocations.length === 0 && (
                  <View style={styles.emptyLocations}>
                    <Text style={styles.emptyLocationsText}>Aucun lieu enregistré</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderTitleContainer: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  modalHeaderPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  addressGroup: {
    zIndex: 1000,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
    zIndex: 1001,
    position: 'relative',
  },
  useHomeButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 32,
  },
  useHomeButton: {
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 5,
  },
  useHomeButtonText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  currentLocationButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 32,
    minWidth: 100,
  },
  currentLocationButton: {
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 5,
  },
  currentLocationButtonText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  addressButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    zIndex: 1001,
  },
  myLocationsButton: {
    backgroundColor: Colors.background.secondary,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  myLocationsButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveLocationContainer: {
    marginTop: 10,
  },
  saveLocationCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationNameInput: {
    marginTop: 10,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  saveLocationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  locationNameInputFlex: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  saveLocationButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveLocationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveLocationButtonDisabled: {
    opacity: 0.5,
  },
  saveLocationButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  // Location Picker Overlay styles
  locationPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  locationPickerBackdrop: {
    flex: 1,
  },
  locationPickerContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  locationPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  locationPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  locationPickerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPickerList: {
    padding: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  locationItemContent: {
    flex: 1,
    padding: 14,
  },
  locationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationItemAddress: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  locationDeleteButton: {
    padding: 14,
    backgroundColor: Colors.status.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLocations: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLocationsText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  saveAsHomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  saveAsHomeText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabelIcon: {
    marginRight: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  formInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  placeholderText: {
    fontSize: 15,
    color: Colors.text.tertiary,
  },
  durationPicker: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  durationOption: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  durationOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  durationOptionTextSelected: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  meetingPointContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  meetingPointOption: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  meetingPointOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  meetingPointText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  meetingPointTextSelected: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  instructionsInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 80,
  },
  modalConfirmButtonContainer: {
    marginTop: 10,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmButton: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
