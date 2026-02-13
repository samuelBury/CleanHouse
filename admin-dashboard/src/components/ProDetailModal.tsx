// Modal Fiche Pro - Composant partagé
import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Star, MapPin, Phone, Mail, MessageSquare, Euro, Send } from 'lucide-react';
import { getProfessionalDetail, addProfessionalNote } from '../services/api';
import type { ProfessionalDetail } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français', en: 'English', ru: 'Русский', ro: 'Română',
  pt: 'Português', ar: 'العربية', es: 'Español', zh: '中文',
};

const SERVICE_LABELS: Record<string, string> = {
  MENAGE: 'Ménage', REPASSAGE: 'Repassage', MENAGE_REPASSAGE: 'Ménage + Repassage',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', assigned: 'Assignée', in_progress: 'En cours',
  completed: 'Terminée', cancelled: 'Annulée',
};

interface Props {
  proId: string | null;
  onClose: () => void;
}

export default function ProDetailModal({ proId, onClose }: Props) {
  const [detailPro, setDetailPro] = useState<ProfessionalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (!proId) {
      setDetailPro(null);
      setNewNote('');
      return;
    }
    setIsLoading(true);
    setDetailPro(null);
    getProfessionalDetail(proId)
      .then(data => setDetailPro(data))
      .catch(err => console.error('Error loading professional detail:', err))
      .finally(() => setIsLoading(false));
  }, [proId]);

  if (!proId) return null;

  const handleAddNote = async () => {
    if (!detailPro || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const note = await addProfessionalNote(detailPro.id, newNote.trim());
      setDetailPro({ ...detailPro, adminNotes: [note, ...(detailPro.adminNotes || [])] });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {(isLoading || !detailPro) ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : detailPro && (
          <>
            {/* Header avec avatar et infos principales */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {detailPro.firstName[0]}{detailPro.lastName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{detailPro.firstName} {detailPro.lastName}</h2>
                  <p className="text-teal-100 text-sm">
                    Inscrit depuis le {format(new Date(detailPro.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {detailPro.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-100 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-100 text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Non vérifié
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${detailPro.isAvailable ? 'bg-blue-500/20 text-blue-100' : 'bg-gray-500/20 text-gray-200'}`}>
                      {detailPro.isAvailable ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{detailPro.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-yellow-700">Note moyenne</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{detailPro.totalMissions}</p>
                  <p className="text-xs text-blue-700">Missions réalisées</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {detailPro.earnings ? detailPro.earnings.reduce((sum, e) => sum + e.amount, 0).toFixed(0) : 0}€
                  </p>
                  <p className="text-xs text-green-700">Gains totaux</p>
                </div>
              </div>

              {/* Informations de contact */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Contact</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> {detailPro.email}
                  </p>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {detailPro.phone}
                  </p>
                  {detailPro.language && (
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-4 h-4 text-gray-400 text-center text-xs">🌐</span> {LANGUAGE_LABELS[detailPro.language] || detailPro.language}
                    </p>
                  )}
                </div>
              </div>

              {/* Adresse */}
              {(detailPro.address || detailPro.city || detailPro.postalCode) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Adresse</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">
                      {[detailPro.address, detailPro.postalCode, detailPro.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Bio */}
              {detailPro.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Bio</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailPro.bio}</p>
                  </div>
                </div>
              )}

              {/* Zones */}
              {detailPro.zones && detailPro.zones.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Zones ({detailPro.zones.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailPro.zones.map((z: any) => {
                      const zone = z.zone || z;
                      return (
                        <span key={zone.id || z.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-200">
                          <MapPin className="w-3.5 h-3.5" />
                          {zone.name}
                          {zone.postalCodes && (
                            <span className="text-purple-400 ml-1 text-xs">({zone.postalCodes.length} CP)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missions récentes */}
              {detailPro.missions && detailPro.missions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Missions récentes</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Service</th>
                          <th className="px-4 py-2 text-left">Statut</th>
                          <th className="px-4 py-2 text-right">Gain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailPro.missions.slice(0, 10).map((m: any) => {
                          const booking = m.booking || {};
                          const date = booking.date || m.date;
                          const service = booking.service || m.service;
                          return (
                            <tr key={m.id} className="text-sm">
                              <td className="px-4 py-2 text-gray-700">
                                {date ? format(new Date(date), 'dd/MM/yyyy', { locale: fr }) : '—'}
                              </td>
                              <td className="px-4 py-2 text-gray-700">
                                {SERVICE_LABELS[service] || service || '—'}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[m.status] || ''}`}>
                                  {STATUS_LABELS[m.status] || m.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700 font-medium">
                                {m.proEarning}€
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Gains */}
              {detailPro.earnings && detailPro.earnings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Historique des gains</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {detailPro.earnings.slice(0, 8).map(earning => (
                      <div key={earning.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Euro className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">{earning.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{earning.amount}€</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${earning.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {earning.isPaid ? 'Payé' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes admin */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Notes admin</span>
                </h3>
                <div className="space-y-3">
                  {/* Formulaire ajout note */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                      placeholder="Ajouter une note..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isAddingNote || !newNote.trim()}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Liste des notes */}
                  {detailPro.adminNotes && detailPro.adminNotes.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {detailPro.adminNotes.map(note => (
                        <div key={note.id} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                          <p className="text-sm text-gray-700">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {note.admin.firstName} {note.admin.lastName} — {format(new Date(note.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune note pour le moment</p>
                  )}
                </div>
              </div>

              {/* Stripe */}
              {detailPro.stripeAccountId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Paiement</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">Stripe ID: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">{detailPro.stripeAccountId}</code></p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
