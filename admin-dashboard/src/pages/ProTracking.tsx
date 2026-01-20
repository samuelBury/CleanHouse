// Page de suivi en temps réel des professionnels
import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { API_URL, MAPBOX_TOKEN } from '../config/constants';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface ProLocation {
  id: string;
  name: string;
  avatar: string | null;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  isSharing: boolean;
  currentMission: {
    id: string;
    address: string;
    service: string;
    destination: {
      latitude: number;
      longitude: number;
    };
  } | null;
}

const ProTracking: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [professionals, setProfessionals] = useState<ProLocation[]>([]);
  const [selectedPro, setSelectedPro] = useState<ProLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    activeOnly: true,
    inMissionOnly: false,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Charger les positions
  const loadLocations = useCallback(async () => {
    const token = localStorage.getItem('adminToken');

    try {
      const params = new URLSearchParams();
      if (filters.activeOnly) params.append('activeOnly', 'true');
      if (filters.inMissionOnly) params.append('inMissionOnly', 'true');

      const response = await fetch(`${API_URL}/api/admin/professionals/locations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setProfessionals(data.data.professionals);
      }
    } catch (error) {
      console.error('Erreur chargement positions:', error);
    }
  }, [filters]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.3522, 48.8566], // Paris par défaut
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!map.current) return;

    // Supprimer les marqueurs des pros qui ne sont plus visibles
    markers.current.forEach((marker, proId) => {
      if (!professionals.find(p => p.id === proId)) {
        marker.remove();
        markers.current.delete(proId);
      }
    });

    // Ajouter ou mettre à jour les marqueurs
    professionals.forEach(pro => {
      if (!pro.location) return;

      const existingMarker = markers.current.get(pro.id);

      if (existingMarker) {
        // Mettre à jour la position
        existingMarker.setLngLat([pro.location.longitude, pro.location.latitude]);
      } else {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'pro-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 ${pro.isSharing ? 'border-green-500' : 'border-gray-300'}">
              ${pro.avatar
                ? `<img src="${pro.avatar}" class="w-8 h-8 rounded-full object-cover" />`
                : `<span class="text-sm font-bold text-gray-600">${pro.name.charAt(0)}</span>`
              }
            </div>
            ${pro.currentMission ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>' : ''}
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pro.location.longitude, pro.location.latitude])
          .addTo(map.current!);

        el.addEventListener('click', () => {
          setSelectedPro(pro);
          map.current?.flyTo({
            center: [pro.location.longitude, pro.location.latitude],
            zoom: 14,
          });
        });

        markers.current.set(pro.id, marker);
      }
    });
  }, [professionals]);

  // Auto-refresh
  useEffect(() => {
    loadLocations();

    if (autoRefresh) {
      const interval = setInterval(loadLocations, 10000); // Toutes les 10 secondes
      return () => clearInterval(interval);
    }
  }, [loadLocations, autoRefresh]);

  // Centrer sur un pro
  const centerOnPro = (pro: ProLocation) => {
    if (pro.location && map.current) {
      map.current.flyTo({
        center: [pro.location.longitude, pro.location.latitude],
        zoom: 15,
      });
      setSelectedPro(pro);
    }
  };

  // Formater le temps écoulé
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const serviceLabels: Record<string, string> = {
    MENAGE: 'Ménage',
    REPASSAGE: 'Repassage',
    MENAGE_REPASSAGE: 'Ménage + Repassage',
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi en temps réel</h1>
            <p className="text-gray-600">
              {professionals.length} professionnel(s) actif(s)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, activeOnly: e.target.checked }))}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Partage actif uniquement</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inMissionOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, inMissionOnly: e.target.checked }))}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">En mission uniquement</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
            </label>
            <button
              onClick={loadLocations}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center"
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Liste des pros */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Professionnels</h2>
          </div>
          <div className="divide-y">
            {professionals.map(pro => (
              <button
                key={pro.id}
                onClick={() => centerOnPro(pro)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition ${selectedPro?.id === pro.id ? 'bg-green-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="relative">
                    {pro.avatar ? (
                      <img src={pro.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">{pro.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${pro.isSharing ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{pro.name}</p>
                    {pro.currentMission ? (
                      <p className="text-sm text-green-600">
                        En mission - {serviceLabels[pro.currentMission.service] || pro.currentMission.service}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Disponible</p>
                    )}
                    {pro.location && (
                      <p className="text-xs text-gray-400">
                        Mis à jour {formatTimeAgo(pro.location.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {professionals.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Aucun professionnel actif</p>
              </div>
            )}
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Panel détails pro sélectionné */}
          {selectedPro && (
            <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 w-80">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  {selectedPro.avatar ? (
                    <img src={selectedPro.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">{selectedPro.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{selectedPro.name}</h3>
                    <p className="text-sm text-gray-500">{selectedPro.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPro(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedPro.currentMission ? (
                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-green-800">Mission en cours</p>
                  <p className="text-sm text-green-700 mt-1">{selectedPro.currentMission.address}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {serviceLabels[selectedPro.currentMission.service] || selectedPro.currentMission.service}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Pas de mission en cours</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Partage de position:</span>
                <span className={`font-medium ${selectedPro.isSharing ? 'text-green-600' : 'text-gray-400'}`}>
                  {selectedPro.isSharing ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {selectedPro.location && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Dernière mise à jour:</span>
                  <span className="text-gray-700">{formatTimeAgo(selectedPro.location.updatedAt)}</span>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <a
                  href={`tel:${selectedPro.phone}`}
                  className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition text-center"
                >
                  Appeler
                </a>
                <a
                  href={`/professionals/${selectedPro.id}`}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition text-center"
                >
                  Voir profil
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProTracking;
