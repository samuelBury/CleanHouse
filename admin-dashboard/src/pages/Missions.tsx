// Page de gestion des missions
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, UserPlus, X, Phone, MapPin, Mail, Clock, Euro } from 'lucide-react';
import ProDetailModal from '../components/ProDetailModal';
import MissionMap from '../components/MissionMap';
import { getMissions, assignMission, cancelMission, findProsForPostalCode } from '../services/api';
import type { Mission, Professional } from '../types';
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

export default function Missions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [availablePros, setAvailablePros] = useState<Professional[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [detailProId, setDetailProId] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, [statusFilter]);

  const loadMissions = async () => {
    setIsLoading(true);
    try {
      const data = await getMissions({ status: statusFilter || undefined });
      setMissions(data.missions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = async (mission: Mission) => {
    setSelectedMission(mission);
    // Extraire le code postal de l'adresse (simplifié - en vrai il faudrait un meilleur parsing)
    const postalCodeMatch = mission.address.match(/\b(\d{5})\b/);
    if (postalCodeMatch) {
      try {
        const data = await findProsForPostalCode(postalCodeMatch[1]);
        setAvailablePros(data.professionals);
      } catch (error) {
        console.error('Error finding pros:', error);
        setAvailablePros([]);
      }
    } else {
      setAvailablePros([]);
    }
  };

  const handleAssign = async (professionalId: string) => {
    if (!selectedMission) return;
    setIsAssigning(true);
    try {
      await assignMission(selectedMission.id, professionalId);
      setSelectedMission(null);
      loadMissions();
    } catch (error) {
      console.error('Error assigning mission:', error);
      alert('Erreur lors de l\'assignation');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancel = async (missionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette mission ?')) return;
    try {
      await cancelMission(missionId);
      loadMissions();
    } catch (error) {
      console.error('Error cancelling mission:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Statut:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilterChange('')}
              className={`px-3 py-1 text-sm rounded-full ${!statusFilter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tout
            </button>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleStatusFilterChange(value)}
                className={`px-3 py-1 text-sm rounded-full ${statusFilter === value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des missions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
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
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {missions.map((mission) => (
                  <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailMission(mission)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mission.client.name}</div>
                      {mission.client.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {mission.client.phone}
                        </div>
                      )}
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={mission.address}>
                        {mission.address}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {mission.status === 'pending' && (
                          <button
                            onClick={() => handleOpenAssignModal(mission)}
                            className="text-teal-600 hover:text-teal-900 flex items-center gap-1"
                          >
                            <UserPlus className="w-4 h-4" /> Assigner
                          </button>
                        )}
                        {!['completed', 'cancelled'].includes(mission.status) && (
                          <button
                            onClick={() => handleCancel(mission.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {missions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune mission trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Modal d'assignation */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Assigner un professionnel</h2>
              <button onClick={() => setSelectedMission(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Info mission */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium">{selectedMission.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium">{SERVICE_LABELS[selectedMission.service]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedMission.date), 'dd MMMM yyyy', { locale: fr })} à {selectedMission.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gain pro</p>
                    <p className="font-medium text-green-600">{selectedMission.proEarning}€</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {selectedMission.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Liste des pros */}
              <h3 className="font-medium text-gray-900 mb-3">Professionnels disponibles dans la zone</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePros.length > 0 ? (
                  availablePros.map((pro) => (
                    <div
                      key={pro.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-teal-500"
                    >
                      <div>
                        <p className="font-medium">{pro.firstName} {pro.lastName}</p>
                        <p className="text-sm text-gray-500">{pro.totalMissions} missions - Note: {pro.rating}/5</p>
                      </div>
                      <button
                        onClick={() => handleAssign(pro.id)}
                        disabled={isAssigning}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >
                        {isAssigning ? 'Assignation...' : 'Assigner'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucun professionnel disponible dans cette zone
                  </p>
                )}
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
