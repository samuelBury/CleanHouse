// Page de gestion des professionnels
import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Star, MapPin, Plus, X, Upload, FileText } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { getProfessionals, verifyProfessional, createProfessional } from '../services/api';
import type { Professional } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Toast, { type ToastType } from '../components/Toast';

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);
  const [contract, setContract] = useState<File | null>(null);
  const [carteVitale, setCarteVitale] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadProfessionals();
  }, [filterVerified, filterAvailable]);

  const loadProfessionals = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterVerified !== null) params.isVerified = filterVerified;
      if (filterAvailable !== null) params.isAvailable = filterAvailable;
      const data = await getProfessionals(params);
      setProfessionals(data);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (proId: string, isVerified: boolean) => {
    try {
      await verifyProfessional(proId, isVerified);
      loadProfessionals();
    } catch (error) {
      console.error('Error verifying professional:', error);
      alert('Erreur lors de la vérification');
    }
  };

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation des documents obligatoires
    if (!idDocument) {
      setFormError('La pièce d\'identité est obligatoire');
      return;
    }
    if (!proofOfAddress) {
      setFormError('Le justificatif de domicile est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPro = await createProfessional({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        idDocument: idDocument,
        proofOfAddress: proofOfAddress,
        contract: contract || undefined,
        carteVitale: carteVitale || undefined,
      });
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postalCode: '' });
      setIdDocument(null);
      setProofOfAddress(null);
      setContract(null);
      setCarteVitale(null);
      setToast({
        message: `${newPro.firstName} ${newPro.lastName} a été ajouté avec succès. Un email d'invitation lui a été envoyé.`,
        type: 'success'
      });
      loadProfessionals();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPros = professionals.filter(pro => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pro.firstName.toLowerCase().includes(query) ||
      pro.lastName.toLowerCase().includes(query) ||
      pro.email.toLowerCase().includes(query) ||
      pro.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Professionnels</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un professionnel
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Recherche */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Filtre vérification */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Vérification:</span>
            <select
              value={filterVerified === null ? '' : String(filterVerified)}
              onChange={(e) => setFilterVerified(e.target.value === '' ? null : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Tous</option>
              <option value="true">Vérifiés</option>
              <option value="false">Non vérifiés</option>
            </select>
          </div>

          {/* Filtre disponibilité */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Disponibilité:</span>
            <select
              value={filterAvailable === null ? '' : String(filterAvailable)}
              onChange={(e) => setFilterAvailable(e.target.value === '' ? null : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Tous</option>
              <option value="true">Disponibles</option>
              <option value="false">Indisponibles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
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
                    Professionnel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
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
                {filteredPros.map((pro) => (
                  <tr key={pro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-teal-600 font-medium">
                            {pro.firstName[0]}{pro.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pro.firstName} {pro.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Inscrit le {format(new Date(pro.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pro.email}</div>
                      <div className="text-sm text-gray-500">{pro.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {pro.zones && pro.zones.length > 0 ? (
                          pro.zones.slice(0, 2).map((zone: any) => (
                            <span key={zone.id} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {zone.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm italic">Aucune zone</span>
                        )}
                        {pro.zones && pro.zones.length > 2 && (
                          <span className="text-gray-500 text-xs">+{pro.zones.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {pro.rating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">{pro.totalMissions} missions</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-xs ${pro.isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                          {pro.isVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {pro.isVerified ? 'Vérifié' : 'Non vérifié'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs ${pro.isAvailable ? 'text-blue-600' : 'text-gray-400'}`}>
                          {pro.isAvailable ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pro.isVerified ? (
                        <button
                          onClick={() => handleVerify(pro.id, false)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Retirer vérification
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(pro.id, true)}
                          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" /> Vérifier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPros.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun professionnel trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ajouter un professionnel */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Ajouter un professionnel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProfessional} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  placeholder="0612345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  onSelect={({ address, city, postalCode }) =>
                    setFormData({ ...formData, address, city, postalCode })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    placeholder="75001"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Paris"
                  />
                </div>
              </div>

              {/* Documents obligatoires */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Documents obligatoires</p>

                {/* Pièce d'identité */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pièce d'identité *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                      className="hidden"
                      id="idDocument"
                    />
                    <label
                      htmlFor="idDocument"
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        idDocument
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {idDocument ? (
                        <>
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate flex-1">{idDocument.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setIdDocument(null); }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Carte d'identité, passeport...</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Justificatif de domicile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justificatif de domicile *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setProofOfAddress(e.target.files?.[0] || null)}
                      className="hidden"
                      id="proofOfAddress"
                    />
                    <label
                      htmlFor="proofOfAddress"
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        proofOfAddress
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {proofOfAddress ? (
                        <>
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate flex-1">{proofOfAddress.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setProofOfAddress(null); }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Facture EDF, quittance de loyer...</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Documents optionnels */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Documents optionnels</p>

                {/* Contrat */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contrat
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setContract(e.target.files?.[0] || null)}
                      className="hidden"
                      id="contract"
                    />
                    <label
                      htmlFor="contract"
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        contract
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {contract ? (
                        <>
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate flex-1">{contract.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setContract(null); }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Contrat de travail, CDD, CDI...</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Carte Vitale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carte Vitale
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setCarteVitale(e.target.files?.[0] || null)}
                      className="hidden"
                      id="carteVitale"
                    />
                    <label
                      htmlFor="carteVitale"
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        carteVitale
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {carteVitale ? (
                        <>
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate flex-1">{carteVitale.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCarteVitale(null); }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Carte Vitale, attestation...</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer et envoyer invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
