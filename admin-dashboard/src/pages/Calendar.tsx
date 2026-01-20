// Page calendrier des missions
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { API_URL } from '../config/constants';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    missionId: string;
    status: string;
    service: string;
    address: string;
    client: string;
    clientPhone: string;
    professional: {
      id: string;
      name: string;
      avatar: string;
    } | null;
    price: number;
    proEarning: number;
    duration: number;
  };
}

interface Zone {
  id: string;
  name: string;
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filters, setFilters] = useState({
    zoneId: '',
    professionalId: '',
    status: '',
  });

  // Charger les zones et pros pour les filtres
  useEffect(() => {
    const loadFiltersData = async () => {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [zonesRes, prosRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/zones`, { headers }),
          fetch(`${API_URL}/api/admin/professionals`, { headers }),
        ]);

        const zonesData = await zonesRes.json();
        const prosData = await prosRes.json();

        if (zonesData.success) setZones(zonesData.data.zones);
        if (prosData.success) setProfessionals(prosData.data.professionals);
      } catch (error) {
        console.error('Erreur chargement filtres:', error);
      }
    };

    loadFiltersData();
  }, []);

  // Charger les missions pour la période visible
  const loadMissions = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      if (filters.zoneId) params.append('zoneId', filters.zoneId);
      if (filters.professionalId) params.append('professionalId', filters.professionalId);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_URL}/api/admin/calendar/missions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
      }
    } catch (error) {
      console.error('Erreur chargement missions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    loadMissions(dateInfo.start, dateInfo.end);
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.toPlainObject());
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
    assigned: { label: 'Assignée', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En cours', color: 'bg-green-100 text-green-800' },
    completed: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  };

  const serviceLabels: Record<string, string> = {
    MENAGE: 'Ménage',
    REPASSAGE: 'Repassage',
    MENAGE_REPASSAGE: 'Ménage + Repassage',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendrier des missions</h1>
        <p className="mt-2 text-gray-600">Vue d'ensemble de toutes les missions planifiées</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select
              value={filters.zoneId}
              onChange={(e) => setFilters(prev => ({ ...prev, zoneId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes les zones</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professionnel</label>
            <select
              value={filters.professionalId}
              onChange={(e) => setFilters(prev => ({ ...prev, professionalId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les pros</option>
              {professionals.map(pro => (
                <option key={pro.id} value={pro.id}>{pro.firstName} {pro.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="assigned">Assignée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-orange-500 mr-2" />
            <span className="text-sm text-gray-600">En attente</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Assignée</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-500 mr-2" />
            <span className="text-sm text-gray-600">En cours</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Terminée</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-500 mr-2" />
            <span className="text-sm text-gray-600">Annulée</span>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
        />
      </div>

      {/* Modal détail mission */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Détails de la mission</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Statut */}
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[selectedEvent.extendedProps.status]?.color}`}>
                    {statusLabels[selectedEvent.extendedProps.status]?.label}
                  </span>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Service</label>
                  <p className="text-gray-900">{serviceLabels[selectedEvent.extendedProps.service] || selectedEvent.extendedProps.service}</p>
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Client</label>
                  <p className="text-gray-900">{selectedEvent.extendedProps.client}</p>
                  {selectedEvent.extendedProps.clientPhone && (
                    <p className="text-gray-600 text-sm">{selectedEvent.extendedProps.clientPhone}</p>
                  )}
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Adresse</label>
                  <p className="text-gray-900">{selectedEvent.extendedProps.address}</p>
                </div>

                {/* Professionnel */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Professionnel</label>
                  {selectedEvent.extendedProps.professional ? (
                    <div className="flex items-center">
                      {selectedEvent.extendedProps.professional.avatar ? (
                        <img
                          src={selectedEvent.extendedProps.professional.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                          <span className="text-green-600 font-medium text-sm">
                            {selectedEvent.extendedProps.professional.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-900">{selectedEvent.extendedProps.professional.name}</span>
                    </div>
                  ) : (
                    <p className="text-orange-600">Non assigné</p>
                  )}
                </div>

                {/* Horaires */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Début</label>
                    <p className="text-gray-900">
                      {new Date(selectedEvent.start).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Durée</label>
                    <p className="text-gray-900">{selectedEvent.extendedProps.duration}h</p>
                  </div>
                </div>

                {/* Prix */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Prix client</label>
                    <p className="text-gray-900 font-semibold">{selectedEvent.extendedProps.price?.toFixed(2)} EUR</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Gain pro</label>
                    <p className="text-green-600 font-semibold">{selectedEvent.extendedProps.proEarning?.toFixed(2)} EUR</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
                <a
                  href={`/missions/${selectedEvent.extendedProps.missionId}`}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Voir la mission
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
