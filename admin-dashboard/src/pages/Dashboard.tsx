// Dashboard principal admin
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, MapPin, AlertCircle, ArrowRight, X, Phone, Mail, Euro } from 'lucide-react';
import ProDetailModal from '../components/ProDetailModal';
import MissionMap from '../components/MissionMap';
import { getDashboardStats } from '../services/api';
import type { DashboardStats, Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SERVICE_LABELS: Record<string, string> = {
  MENAGE: 'Ménage',
  REPASSAGE: 'Repassage',
  MENAGE_REPASSAGE: 'Ménage + Repassage',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  assigned: 'Assignée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMissions, setRecentMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [detailProId, setDetailProId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data.stats);
      setRecentMissions(data.recentMissions);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Missions en attente</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingMissions || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <Link to="/missions?status=pending" className="mt-4 flex items-center text-sm text-teal-600 hover:underline">
            Voir les missions <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Missions aujourd'hui</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.todayMissions || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pros disponibles</p>
              <p className="text-3xl font-bold text-green-600">{stats?.activePros || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <Link to="/professionals" className="mt-4 flex items-center text-sm text-teal-600 hover:underline">
            Gérer les pros <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zones actives</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.totalZones || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to="/zones" className="mt-4 flex items-center text-sm text-teal-600 hover:underline">
            Gérer les zones <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Recent Missions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Dernières missions</h2>
          <Link to="/missions" className="text-sm text-teal-600 hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pro assigné
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMissions.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailMission(mission)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mission.client.name}</div>
                    <div className="text-sm text-gray-500">{mission.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{SERVICE_LABELS[mission.service]}</div>
                    <div className="text-sm text-gray-500">{mission.duration}h - {mission.price}€</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(mission.date), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    <div className="text-sm text-gray-500">{mission.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {mission.professional ? (
                      <div className="text-sm text-gray-900">
                        {mission.professional.firstName} {mission.professional.lastName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[mission.status]}`}>
                      {STATUS_LABELS[mission.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {recentMissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune mission récente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal détail mission */}
      {detailMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Détail de la mission</h2>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[detailMission.status]}`}>
                  {STATUS_LABELS[detailMission.status]}
                </span>
              </div>
              <button onClick={() => setDetailMission(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-73px)] space-y-5">
              {/* Client */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Client</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p className="font-medium text-gray-900">{detailMission.client.name}</p>
                  {detailMission.client.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {detailMission.client.email}
                    </p>
                  )}
                  {detailMission.client.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {detailMission.client.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Service */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Service</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium text-gray-900">{SERVICE_LABELS[detailMission.service]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Durée</p>
                      <p className="font-medium text-gray-900">{detailMission.duration}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Prix client</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" /> {detailMission.price}€
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Gain pro</p>
                    <p className="font-medium text-green-600">{detailMission.proEarning}€</p>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Date & Heure</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {format(new Date(detailMission.date), 'EEEE dd MMMM yyyy', { locale: fr })} à {detailMission.time}
                  </p>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Adresse</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="font-medium text-gray-900">{detailMission.address}</p>
                </div>
              </div>

              {/* Carte */}
              {detailMission.latitude && detailMission.longitude && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Localisation</h3>
                  <MissionMap
                    missionLat={detailMission.latitude}
                    missionLng={detailMission.longitude}
                    missionAddress={detailMission.address}
                    proLat={detailMission.professional?.latitude}
                    proLng={detailMission.professional?.longitude}
                    proName={detailMission.professional ? `${detailMission.professional.firstName} ${detailMission.professional.lastName}` : undefined}
                  />
                </div>
              )}

              {/* Notes */}
              {detailMission.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailMission.notes}</p>
                  </div>
                </div>
              )}

              {/* Pro assigné */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Professionnel assigné</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {detailMission.professional ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => setDetailProId(detailMission.professional!.id)}
                        className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        {detailMission.professional.firstName} {detailMission.professional.lastName}
                      </button>
                      {detailMission.professional.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {detailMission.professional.phone}
                        </p>
                      )}
                      {detailMission.professional.rating != null && (
                        <p className="text-sm text-gray-600">Note : {detailMission.professional.rating}/5</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Non assigné</p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Historique</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Créée le</span>
                    <span className="text-gray-900">{format(new Date(detailMission.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  </div>
                  {detailMission.assignedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assignée le</span>
                      <span className="text-gray-900">{format(new Date(detailMission.assignedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                  )}
                  {detailMission.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Démarrée le</span>
                      <span className="text-gray-900">{format(new Date(detailMission.startedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                  )}
                  {detailMission.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Terminée le</span>
                      <span className="text-gray-900">{format(new Date(detailMission.completedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fiche Pro */}
      <ProDetailModal proId={detailProId} onClose={() => setDetailProId(null)} />
    </div>
  );
}
