// Carte des zones d'intervention des professionnels
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { RefreshCw, User, MapPin, Target } from 'lucide-react';
import { getProLocations, type ProfessionalLocation } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Couleurs distinctes pour chaque pro
const COLORS = [
  '#8B5CF6', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#E11D48', '#A855F7', '#10B981', '#0EA5E9',
];

const createMarkerIcon = (color: string) =>
  new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

function FitBounds({ pros }: { pros: ProfessionalLocation[] }) {
  const map = useMap();

  useEffect(() => {
    const withHome = pros.filter((p) => p.homeLocation);
    if (withHome.length > 0) {
      const bounds = new LatLngBounds(
        withHome.map((p) => [p.homeLocation!.latitude, p.homeLocation!.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [pros, map]);

  return null;
}

export default function ProZones() {
  const [professionals, setProfessionals] = useState<ProfessionalLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProLocations();
      setProfessionals(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const prosWithZone = professionals.filter((p) => p.homeLocation && p.radius);
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones d'intervention</h1>
          <p className="text-gray-500">
            {prosWithZone.length} professionnel{prosWithZone.length > 1 ? 's' : ''} avec zone
            {' '}sur {professionals.length} total
          </p>
        </div>

        <button
          onClick={fetchLocations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {prosWithZone.length > 0 && <FitBounds pros={prosWithZone} />}

          {prosWithZone.map((pro, index) => {
            const color = COLORS[index % COLORS.length];
            const radiusMeters = (pro.radius ?? 5) * 1000;

            return (
              <span key={pro.id}>
                <Circle
                  center={[pro.homeLocation!.latitude, pro.homeLocation!.longitude]}
                  radius={radiusMeters}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.12,
                    weight: 2,
                  }}
                />
                <Marker
                  position={[pro.homeLocation!.latitude, pro.homeLocation!.longitude]}
                  icon={createMarkerIcon(color)}
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
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {pro.address && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{pro.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>Rayon : {pro.radius} km</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </span>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{prosWithZone.length}</p>
              <p className="text-sm text-gray-500">Pros avec zone</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.length - prosWithZone.length}
              </p>
              <p className="text-sm text-gray-500">Sans zone</p>
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
              <p className="text-sm text-gray-500">Total pros</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
