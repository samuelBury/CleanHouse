import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {Colors} from '../config/theme';

export interface Reservation {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  address: string;
  price: number;
  status: 'confirmed' | 'completed' | 'cancelled';
}

interface AgendaScreenProps {
  reservations: Reservation[];
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function AgendaScreen({reservations}: AgendaScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'})
  );

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajuster pour commencer la semaine le lundi (0 = lundi, 6 = dimanche)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    return {year, month, daysInMonth, startDay};
  };

  const formatDateKey = (day: number, month: number, year: number) => {
    return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
  };

  const hasReservation = (dateKey: string) => {
    return reservations.some(r => r.date === dateKey);
  };

  const getReservationsForDate = (dateKey: string | null) => {
    if (!dateKey) return [];
    return reservations.filter(r => r.date === dateKey);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const {year, month, daysInMonth, startDay} = getMonthData(currentDate);

  const renderCalendarDays = () => {
    const days = [];

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(day, month, year);
      const isSelected = selectedDate === dateKey;
      const hasRes = hasReservation(dateKey);
      const isToday = dateKey === new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isToday && !isSelected && styles.dayCellToday,
          ]}
          onPress={() => setSelectedDate(dateKey)}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.dayTextSelected,
            isToday && !isSelected && styles.dayTextToday,
          ]}>
            {day}
          </Text>
          {hasRes && <View style={[styles.reservationDot, isSelected && styles.reservationDotSelected]} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Ménage': return '🏠';
      case 'Repassage': return '👔';
      default: return '✨';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {text: 'Confirmée', color: Colors.primary, bg: Colors.primary};
      case 'completed':
        return {text: 'Terminée', color: Colors.status.success, bg: '#E8F5E9'};
      case 'cancelled':
        return {text: 'Annulée', color: Colors.status.error, bg: '#FFEBEE'};
      default:
        return {text: status, color: Colors.text.secondary, bg: Colors.background.secondary};
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const selectedReservations = getReservationsForDate(selectedDate);

  const getSelectedDateDisplay = () => {
    if (!selectedDate) return '';
    const [day, monthNum] = selectedDate.split('/');
    return `${parseInt(day)} ${MONTHS[parseInt(monthNum) - 1]}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Agenda</Text>
        <Text style={styles.headerSubtitle}>{reservations.length} réservation{reservations.length > 1 ? 's' : ''}</Text>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysHeader}>
          {DAYS.map((day, index) => (
            <View key={index} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {renderCalendarDays()}
        </View>
      </View>

      {/* Reservations List */}
      <View style={styles.reservationsContainer}>
        <Text style={styles.reservationsTitle}>
          Réservations du {getSelectedDateDisplay()}
        </Text>

        {selectedReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Aucune réservation ce jour</Text>
          </View>
        ) : (
          selectedReservations.map((reservation) => {
            const statusBadge = getStatusBadge(reservation.status);
            return (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <View style={styles.serviceInfo}>
                    <View style={styles.serviceIcon}>
                      <Text style={styles.serviceIconText}>{getServiceIcon(reservation.service)}</Text>
                    </View>
                    <View>
                      <Text style={styles.serviceName}>{reservation.service}</Text>
                      <Text style={styles.serviceTime}>
                        {reservation.time} - {calculateEndTime(reservation.time, reservation.duration)} ({reservation.duration}h)
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, {backgroundColor: statusBadge.bg}]}>
                    <Text style={[styles.statusText, {color: statusBadge.color}]}>{statusBadge.text}</Text>
                  </View>
                </View>

                <View style={styles.reservationDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText}>{reservation.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>💰</Text>
                    <Text style={styles.detailPrice}>{reservation.price}€</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: Colors.background.primary,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  dayCellToday: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  dayTextSelected: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '600',
  },
  reservationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    position: 'absolute',
    bottom: 4,
  },
  reservationDotSelected: {
    backgroundColor: Colors.text.inverse,
  },
  reservationsContainer: {
    paddingHorizontal: 16,
  },
  reservationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  reservationCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceIconText: {
    fontSize: 22,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  serviceTime: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomPadding: {
    height: 100,
  },
});
