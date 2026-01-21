// Page de gestion des zones géographiques
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Users } from 'lucide-react';
import { getZones, createZone, updateZone, deleteZone, getProfessionals, assignProToZone, removeProFromZone } from '../services/api';
import type { Zone, Professional } from '../types';

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [managingProsZone, setManagingProsZone] = useState<Zone | null>(null);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPostalCodes, setFormPostalCodes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [zonesData, prosData] = await Promise.all([
        getZones(),
        getProfessionals({ isVerified: true }),
      ]);
      setZones(zonesData);
      setAllProfessionals(prosData);
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createZone({
        name: formName,
        postalCodes: formPostalCodes.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setFormName('');
      setFormPostalCodes('');
      loadData();
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Erreur lors de la création');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    try {
      await updateZone(editingZone.id, {
        name: formName,
        postalCodes: formPostalCodes.split(',').map(s => s.trim()).filter(Boolean),
      });
      setEditingZone(null);
      setFormName('');
      setFormPostalCodes('');
      loadData();
    } catch (error) {
      console.error('Error updating zone:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;
    try {
      await deleteZone(zoneId);
      loadData();
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (zone: Zone) => {
    try {
      await updateZone(zone.id, { isActive: !zone.isActive });
      loadData();
    } catch (error) {
      console.error('Error toggling zone:', error);
    }
  };

  const handleAssignPro = async (proId: string) => {
    if (!managingProsZone) return;
    try {
      await assignProToZone(managingProsZone.id, proId);
      loadData();
      // Rafraîchir les zones pour la modal
      const updatedZones = await getZones();
      setManagingProsZone(updatedZones.find(z => z.id === managingProsZone.id) || null);
    } catch (error) {
      console.error('Error assigning pro:', error);
    }
  };

  const handleRemovePro = async (proId: string) => {
    if (!managingProsZone) return;
    try {
      await removeProFromZone(managingProsZone.id, proId);
      loadData();
      const updatedZones = await getZones();
      setManagingProsZone(updatedZones.find(z => z.id === managingProsZone.id) || null);
    } catch (error) {
      console.error('Error removing pro:', error);
    }
  };

  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormPostalCodes(zone.postalCodes.join(', '));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zones géographiques</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" /> Nouvelle zone
        </button>
      </div>

      {/* Liste des zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : zones.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucune zone créée
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone.id} className={`bg-white rounded-lg shadow p-6 ${!zone.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-500">
                    {zone.postalCodes.length} code(s) postal(aux)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(zone)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Codes postaux:</p>
                <div className="flex flex-wrap gap-1">
                  {zone.postalCodes.map((code) => (
                    <span key={code} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Professionnels ({zone.professionals?.length || 0})</p>
                  <button
                    onClick={() => setManagingProsZone(zone)}
                    className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
                  >
                    <Users className="w-4 h-4" /> Gérer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {zone.professionals?.slice(0, 3).map((pro: any) => (
                    <span key={pro.id} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
                      {pro.firstName} {pro.lastName}
                    </span>
                  ))}
                  {(zone.professionals?.length || 0) > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{zone.professionals!.length - 3} autre(s)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-sm ${zone.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleToggleActive(zone)}
                  className="text-sm text-teal-600 hover:underline"
                >
                  {zone.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal création/édition */}
      {(showCreateModal || editingZone) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingZone ? 'Modifier la zone' : 'Nouvelle zone'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setEditingZone(null); setFormName(''); setFormPostalCodes(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingZone ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la zone</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Paris 15, Boulogne-Billancourt"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codes postaux</label>
                <textarea
                  value={formPostalCodes}
                  onChange={(e) => setFormPostalCodes(e.target.value)}
                  placeholder="75015, 75016, 92100"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">Séparez les codes par des virgules</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingZone(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {editingZone ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gestion des pros */}
      {managingProsZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Professionnels - {managingProsZone.name}
              </h2>
              <button onClick={() => setManagingProsZone(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Pros assignés */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Assignés à cette zone</h3>
                {managingProsZone.professionals && managingProsZone.professionals.length > 0 ? (
                  <div className="space-y-2">
                    {managingProsZone.professionals.map((pro: any) => (
                      <div key={pro.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                        <div>
                          <p className="font-medium">{pro.firstName} {pro.lastName}</p>
                          <p className="text-sm text-gray-500">
                            Priorité: {pro.priority || 0}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemovePro(pro.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun professionnel assigné</p>
                )}
              </div>

              {/* Pros disponibles */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Professionnels disponibles</h3>
                <div className="space-y-2">
                  {allProfessionals
                    .filter(p => !managingProsZone.professionals?.find((zp: any) => zp.id === p.id))
                    .map((pro) => (
                      <div key={pro.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{pro.firstName} {pro.lastName}</p>
                          <p className="text-sm text-gray-500">{pro.totalMissions} missions</p>
                        </div>
                        <button
                          onClick={() => handleAssignPro(pro.id)}
                          className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
