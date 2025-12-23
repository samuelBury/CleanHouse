import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: string;
}

export default function BookingModal({visible, onClose, onConfirm, service}: BookingModalProps) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

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
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <Text style={styles.modalIconText}>
                {service === 'Ménage' ? '🏠' : service === 'Repassage' ? '👔' : '✨'}
              </Text>
            </View>
            <Text style={styles.modalHeaderTitle}>{service}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Adresse */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Text style={styles.formLabelIcon}>📍</Text>
                <Text style={styles.formLabel}>Adresse</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="123 Rue de Paris, 75001 Paris"
                placeholderTextColor="#999"
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Text style={styles.formLabelIcon}>📅</Text>
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
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Heure */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Text style={styles.formLabelIcon}>🕐</Text>
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
                <Text style={styles.formLabelIcon}>⏱️</Text>
                <Text style={styles.formLabel}>Nombre d'heures</Text>
              </View>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowDurationPicker(!showDurationPicker)}
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
            <TouchableOpacity style={styles.modalConfirmButton} onPress={onConfirm}>
              <Text style={styles.modalConfirmButtonText}>
                Confirmer la réservation
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    backgroundColor: '#5FB17C',
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
  modalIconText: {
    fontSize: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '400',
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabelIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#5FB17C',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#5FB17C',
  },
  timeText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
  },
  durationPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderColor: '#5FB17C',
  },
  durationOption: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  durationOptionSelected: {
    backgroundColor: '#5FB17C',
    borderColor: '#5FB17C',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  durationOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#5FB17C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
