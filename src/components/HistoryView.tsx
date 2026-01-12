import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Reservation} from './AgendaScreen';
import {Colors} from '../config/theme';

interface HistoryScreenProps {
  reservations: Reservation[];
  onBookingPress?: (reservation: Reservation) => void;
}

type SortOrder = 'newest' | 'oldest';
type FilterStatus = 'all' | 'confirmed' | 'completed' | 'cancelled';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function HistoryScreen({reservations, onBookingPress}: HistoryScreenProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Parser une date (ISO ou DD/MM/YYYY) en objet Date
  const parseDate = (dateStr: string): Date => {
    // Si c'est une date ISO
    if (dateStr.includes('T') || dateStr.includes('-')) {
      return new Date(dateStr);
    }
    // Sinon DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Obtenir les années disponibles dans les réservations
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    reservations.forEach(r => {
      const date = parseDate(r.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [reservations]);

  // Filtrer et trier les réservations
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filtre par mois
    if (filterMonth !== null) {
      filtered = filtered.filter(r => {
        const date = parseDate(r.date);
        return date.getMonth() === filterMonth;
      });
    }

    // Filtre par année
    if (filterYear !== null) {
      filtered = filtered.filter(r => {
        const date = parseDate(r.date);
        return date.getFullYear() === filterYear;
      });
    }

    // Tri par date
    filtered.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return sortOrder === 'newest'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [reservations, sortOrder, filterStatus, filterMonth, filterYear]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterMonth, filterYear, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  // Grouper par mois/année (utilise les réservations paginées)
  const groupedReservations = useMemo(() => {
    const groups: {[key: string]: Reservation[]} = {};

    paginatedReservations.forEach(reservation => {
      const date = parseDate(reservation.date);
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(reservation);
    });

    return groups;
  }, [paginatedReservations]);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Ménage': return 'home';
      case 'Repassage': return 'tshirt';
      default: return 'magic';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {text: 'Confirmée', color: Colors.text.inverse, bg: Colors.primary};
      case 'completed':
        return {text: 'Terminée', color: Colors.status.success, bg: Colors.primaryBackground};
      case 'cancelled':
        return {text: 'Annulée', color: Colors.status.error, bg: '#FFEBEE'};
      default:
        return {text: status, color: Colors.text.secondary, bg: Colors.background.secondary};
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    const day = date.getDate();
    const month = MONTHS[date.getMonth()].slice(0, 3);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMonth(null);
    setFilterYear(null);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterMonth !== null || filterYear !== null;

  // Statistiques
  const stats = useMemo(() => {
    const completed = reservations.filter(r => r.status === 'completed');
    const totalSpent = completed.reduce((acc, r) => acc + r.price, 0);
    const totalHours = completed.reduce((acc, r) => acc + r.duration, 0);
    return {
      total: reservations.length,
      completed: completed.length,
      totalSpent,
      totalHours,
    };
  }, [reservations]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSubtitle}>{stats.total} prestation{stats.total > 1 ? 's' : ''}</Text>
      </View>

      <View style={{height: 16}} />

      {/* Filtres et Tri */}
      <View style={styles.controlsContainer}>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'newest' && styles.sortButtonActive]}
            onPress={() => setSortOrder('newest')}
          >
            <Text style={[styles.sortButtonText, sortOrder === 'newest' && styles.sortButtonTextActive]}>
              Plus récent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'oldest' && styles.sortButtonActive]}
            onPress={() => setSortOrder('oldest')}
          >
            <Text style={[styles.sortButtonText, sortOrder === 'oldest' && styles.sortButtonTextActive]}>
              Plus ancien
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesome5
            name="filter"
            size={12}
            color={hasActiveFilters ? Colors.text.inverse : Colors.text.secondary}
            style={styles.filterIcon}
          />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            Filtrer
          </Text>
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {(filterStatus !== 'all' ? 1 : 0) + (filterMonth !== null ? 1 : 0) + (filterYear !== null ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          {filterStatus !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {filterStatus === 'confirmed' ? 'Confirmée' : filterStatus === 'completed' ? 'Terminée' : 'Annulée'}
              </Text>
              <TouchableOpacity onPress={() => setFilterStatus('all')} style={styles.activeFilterRemoveBtn}>
                <FontAwesome5 name="times" size={10} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>
          )}
          {filterMonth !== null && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{MONTHS[filterMonth]}</Text>
              <TouchableOpacity onPress={() => setFilterMonth(null)} style={styles.activeFilterRemoveBtn}>
                <FontAwesome5 name="times" size={10} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>
          )}
          {filterYear !== null && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{filterYear}</Text>
              <TouchableOpacity onPress={() => setFilterYear(null)} style={styles.activeFilterRemoveBtn}>
                <FontAwesome5 name="times" size={10} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste des réservations groupées */}
      <View style={styles.listContainer}>
        {Object.keys(groupedReservations).length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="clipboard-list" size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Aucune prestation trouvée</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                <Text style={styles.emptyButtonText}>Effacer les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          Object.entries(groupedReservations).map(([monthYear, items]) => (
            <View key={monthYear}>
              <Text style={styles.monthHeader}>{monthYear}</Text>
              {items.map((reservation) => {
                const statusBadge = getStatusBadge(reservation.status);
                return (
                  <TouchableOpacity
                    key={reservation.id}
                    style={styles.reservationCard}
                    onPress={() => onBookingPress?.(reservation)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reservationLeft}>
                      <View style={styles.serviceIcon}>
                        <FontAwesome5 name={getServiceIcon(reservation.service)} size={18} color={Colors.text.inverse} solid />
                      </View>
                    </View>
                    <View style={styles.reservationCenter}>
                      <Text style={styles.serviceName}>{reservation.service}</Text>
                      <Text style={styles.reservationDate}>
                        {formatDate(reservation.date)} • {reservation.time} - {calculateEndTime(reservation.time, reservation.duration)}
                      </Text>
                      <Text style={styles.reservationAddress} numberOfLines={1}>
                        {reservation.address}
                      </Text>
                    </View>
                    <View style={styles.reservationRight}>
                      <View style={[styles.statusBadge, {backgroundColor: statusBadge.bg}]}>
                        <Text style={[styles.statusText, {color: statusBadge.color}]}>{statusBadge.text}</Text>
                      </View>
                      <Text style={styles.priceText}>{reservation.price}€</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <FontAwesome5
                name="chevron-left"
                size={14}
                color={currentPage === 1 ? Colors.text.tertiary : Colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.paginationNumbers}>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                <TouchableOpacity
                  key={page}
                  style={[styles.paginationNumber, currentPage === page && styles.paginationNumberActive]}
                  onPress={() => setCurrentPage(page)}
                >
                  <Text style={[styles.paginationNumberText, currentPage === page && styles.paginationNumberTextActive]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <FontAwesome5
                name="chevron-right"
                size={14}
                color={currentPage === totalPages ? Colors.text.tertiary : Colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Info pagination */}
        {filteredReservations.length > 0 && (
          <Text style={styles.paginationInfo}>
            {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)} sur {filteredReservations.length}
          </Text>
        )}
      </View>

      <View style={styles.bottomPadding} />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <FontAwesome5 name="times" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filtre par statut */}
              <Text style={styles.filterSectionTitle}>Statut</Text>
              <View style={styles.filterOptions}>
                {[
                  {value: 'all', label: 'Tous'},
                  {value: 'confirmed', label: 'Confirmée'},
                  {value: 'completed', label: 'Terminée'},
                  {value: 'cancelled', label: 'Annulée'},
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterStatus === option.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterStatus(option.value as FilterStatus)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterStatus === option.value && styles.filterOptionTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtre par mois */}
              <Text style={styles.filterSectionTitle}>Mois</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, filterMonth === null && styles.filterOptionActive]}
                  onPress={() => setFilterMonth(null)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterMonth === null && styles.filterOptionTextActive,
                  ]}>
                    Tous
                  </Text>
                </TouchableOpacity>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterOption,
                      filterMonth === index && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterMonth(index)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterMonth === index && styles.filterOptionTextActive,
                    ]}>
                      {month.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtre par année */}
              <Text style={styles.filterSectionTitle}>Année</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, filterYear === null && styles.filterOptionActive]}
                  onPress={() => setFilterYear(null)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterYear === null && styles.filterOptionTextActive,
                  ]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {availableYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.filterOption,
                      filterYear === year && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterYear(year)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterYear === year && styles.filterOptionTextActive,
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: Colors.secondary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: Colors.text.inverse,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.text.inverse,
  },
  filterBadge: {
    backgroundColor: Colors.text.inverse,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '500',
  },
  activeFilterRemoveBtn: {
    marginLeft: 6,
  },
  clearFiltersText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  reservationCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  reservationLeft: {
    marginRight: 12,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservationCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reservationDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  reservationAddress: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  reservationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptyState: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.background.secondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  paginationNumbers: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationNumberActive: {
    backgroundColor: Colors.primary,
  },
  paginationNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  paginationNumberTextActive: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  paginationInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 12,
  },
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  filterOptionTextActive: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
});
