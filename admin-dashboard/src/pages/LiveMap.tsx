// Carte temps réel des professionnels
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { RefreshCw, User, MapPin, Clock, Briefcase } from 'lucide-react';
import { getProLocations, type ProfessionalLocation } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const createMarkerIcon = (isSharing: boolean, hasMission: boolean) => {
  const color = hasMission ? '#8B5CF6' : isSharing ? '#22C55E' : '#6B7280';
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36">
        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
    `)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Component to fit bounds
function FitBounds({ professionals }: { professionals: ProfessionalLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (professionals.length > 0) {
      const bounds = new LatLngBounds(
        professionals.map((p) => [p.location.latitude, p.location.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [professionals, map]);

  return null;
}

export default function LiveMap() {
  const [professionals, setProfessionals] = useState<ProfessionalLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await getProLocations(showOnlyActive);
      setProfessionals(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [showOnlyActive]);

  useEffect(() => {
    fetchLocations();

    // Auto-refresh toutes les 10 secondes si activé
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchLocations, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchLocations, autoRefresh]);

  const formatLastUpdate = (date: string) => {
    const now = new Date();
    const updated = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);

    if (diffSeconds < 60) return `il y a ${diffSeconds}s`;
    if (diffSeconds < 3600) return `il y a ${Math.floor(diffSeconds / 60)}min`;
    return `il y a ${Math.floor(diffSeconds / 3600)}h`;
  };

  const serviceLabels: Record<string, string> = {
    MENAGE: 'Ménage',
    REPASSAGE: 'Repassage',
    MENAGE_REPASSAGE: 'Ménage + Repassage',
  };

  // Centre par défaut sur Paris
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carte en direct</h1>
          <p className="text-gray-500">
            {professionals.length} professionnel{professionals.length > 1 ? 's' : ''} localisé{professionals.length > 1 ? 's' : ''}
            {lastUpdate && (
              <span className="ml-2 text-xs">
                • Mis à jour {formatLastUpdate(lastUpdate.toISOString())}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle actifs seulement */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Actifs uniquement
          </label>

          {/* Toggle auto-refresh */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Auto-refresh
          </label>

          {/* Refresh button */}
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>En mission</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>GPS actif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span>Dernière position connue</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {professionals.length > 0 && <FitBounds professionals={professionals} />}

          {professionals.map((pro) => (
            <Marker
              key={pro.id}
              position={[pro.location.latitude, pro.location.longitude]}
              icon={createMarkerIcon(pro.isSharing, !!pro.currentMission)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      {pro.avatar ? (
                        <img src={pro.avatar} alt={pro.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <User className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pro.name}</p>
                      <p className={`text-xs ${pro.isSharing ? 'text-green-600' : 'text-gray-500'}`}>
                        {pro.isSharing ? '● GPS actif' : '○ GPS inactif'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Mis à jour {formatLastUpdate(pro.location.updatedAt)}</span>
                    </div>

                    {pro.currentMission && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-purple-600 font-medium">
                          <Briefcase className="w-4 h-4" />
                          <span>Mission en cours</span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          {serviceLabels[pro.currentMission.service] || pro.currentMission.service}
                        </p>
                        <div className="flex items-start gap-2 text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{pro.currentMission.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.filter((p) => p.isSharing).length}
              </p>
              <p className="text-sm text-gray-500">GPS actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.filter((p) => p.currentMission).length}
              </p>
              <p className="text-sm text-gray-500">En mission</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{professionals.length}</p>
              <p className="text-sm text-gray-500">Total localisés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
