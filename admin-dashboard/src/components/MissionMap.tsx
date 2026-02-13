import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const missionIcon = createMarkerIcon('#E11D48');
const proIcon = createMarkerIcon('#0D9488');

interface FitBoundsProps {
  bounds: LatLngBounds;
}

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [map, bounds]);
  return null;
}

interface MissionMapProps {
  missionLat: number;
  missionLng: number;
  missionAddress: string;
  proLat?: number;
  proLng?: number;
  proName?: string;
}

export default function MissionMap({ missionLat, missionLng, missionAddress, proLat, proLng, proName }: MissionMapProps) {
  const hasProLocation = proLat != null && proLng != null;

  const bounds = hasProLocation
    ? new LatLngBounds([missionLat, missionLng], [proLat!, proLng!])
    : undefined;

  return (
    <div className="rounded-lg overflow-hidden" style={{ height: 200 }}>
      <MapContainer
        center={[missionLat, missionLng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBounds bounds={bounds} />}
        <Marker position={[missionLat, missionLng]} icon={missionIcon}>
          <Popup>{missionAddress}</Popup>
        </Marker>
        {hasProLocation && (
          <Marker position={[proLat!, proLng!]} icon={proIcon}>
            <Popup>{proName || 'Professionnel'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
