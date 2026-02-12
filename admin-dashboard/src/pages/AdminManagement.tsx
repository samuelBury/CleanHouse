// Page de gestion des administrateurs
import { useState, useEffect } from 'react';
import { Search, Plus, X, Shield, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { getAdmins, createAdmin, updateAdmin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Admin } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Toast, { type ToastType } from '../components/Toast';

export default function AdminManagement() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'operator' as 'operator' | 'super_admin',
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    if (admin.id === currentAdmin?.id) return;
    try {
      await updateAdmin(admin.id, { isActive: !admin.isActive });
      setToast({
        message: `${admin.firstName} ${admin.lastName} a été ${admin.isActive ? 'désactivé' : 'activé'}`,
        type: 'success',
      });
      loadAdmins();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Erreur lors de la modification',
        type: 'error',
      });
    }
  };

  const handleChangeRole = async (admin: Admin, newRole: 'operator' | 'super_admin') => {
    if (admin.id === currentAdmin?.id) return;
    try {
      await updateAdmin(admin.id, { role: newRole });
      setToast({
        message: `Rôle de ${admin.firstName} ${admin.lastName} modifié en ${newRole === 'super_admin' ? 'Super Admin' : 'Opérateur'}`,
        type: 'success',
      });
      loadAdmins();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Erreur lors de la modification',
        type: 'error',
      });
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsSubmitting(true);
    try {
      const newAdmin = await createAdmin(formData);
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'operator' });
      setToast({
        message: `${newAdmin.firstName} ${newAdmin.lastName} a été créé avec succès`,
        type: 'success',
      });
      loadAdmins();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      admin.firstName.toLowerCase().includes(query) ||
      admin.lastName.toLowerCase().includes(query) ||
      admin.email.toLowerCase().includes(query)
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
        <h1 className="text-2xl font-bold text-gray-900">Administrateurs</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel admin
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
            />
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
                    Administrateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-teal-600 font-medium">
                            {admin.firstName[0]}{admin.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Créé le {format(new Date(admin.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <ShieldCheck className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3" />
                          Opérateur
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <UserCheck className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <UserX className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLoginAt
                        ? format(new Date(admin.lastLoginAt), 'dd MMM yyyy HH:mm', { locale: fr })
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.id === currentAdmin?.id ? (
                        <span className="text-xs text-gray-400 italic">Vous</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <select
                            value={admin.role}
                            onChange={(e) =>
                              handleChangeRole(admin, e.target.value as 'operator' | 'super_admin')
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-teal-500 focus:border-teal-500"
                          >
                            <option value="operator">Opérateur</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <button
                            onClick={() => handleToggleActive(admin)}
                            className={`text-sm ${
                              admin.isActive
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {admin.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun administrateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nouvel admin */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nouvel administrateur</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-4 space-y-4">
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
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'operator' | 'super_admin' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="operator">Opérateur</option>
                  <option value="super_admin">Super Admin</option>
                </select>
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
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
