// Page d'historique des actions (Audit Logs)
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, ChevronLeft, ChevronRight, History, User, Calendar } from 'lucide-react';
import { useAuditLogs } from '../hooks/useApi';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  'mission.assign': 'Assignation mission',
  'mission.reassign': 'Réassignation mission',
  'mission.cancel': 'Annulation mission',
  'mission.status_change': 'Changement statut mission',
  'professional.verify': 'Vérification professionnel',
  'professional.suspend': 'Suspension professionnel',
  'professional.reactivate': 'Réactivation professionnel',
  'professional.update': 'Modification professionnel',
  'professional.add_note': 'Note ajoutée',
  'zone.create': 'Création zone',
  'zone.update': 'Modification zone',
  'zone.delete': 'Suppression zone',
  'zone.assign_professional': 'Pro assigné à zone',
  'zone.assign_admin': 'Admin assigné à zone',
  'urgency.create': 'Création urgence',
  'urgency.resolve': 'Résolution urgence',
  'urgency.assign': 'Prise en charge urgence',
  'admin.create': 'Création admin',
  'admin.update': 'Modification admin',
  'admin.deactivate': 'Désactivation admin',
};

const ENTITY_LABELS: Record<string, string> = {
  mission: 'Mission',
  professional: 'Professionnel',
  zone: 'Zone',
  urgency: 'Urgence',
  admin: 'Admin',
};

const ACTION_COLORS: Record<string, string> = {
  assign: 'bg-blue-100 text-blue-800',
  reassign: 'bg-purple-100 text-purple-800',
  cancel: 'bg-red-100 text-red-800',
  verify: 'bg-green-100 text-green-800',
  create: 'bg-teal-100 text-teal-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  resolve: 'bg-green-100 text-green-800',
  add_note: 'bg-gray-100 text-gray-800',
  suspend: 'bg-orange-100 text-orange-800',
  reactivate: 'bg-green-100 text-green-800',
  deactivate: 'bg-red-100 text-red-800',
  status_change: 'bg-indigo-100 text-indigo-800',
};

function getActionColor(action: string): string {
  const actionKey = action.split('.')[1] || action;
  return ACTION_COLORS[actionKey] || 'bg-gray-100 text-gray-800';
}

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [entityTypeFilter, setEntityTypeFilter] = useState(searchParams.get('entityType') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [searchQuery, setSearchQuery] = useState('');

  // Date range: last 7 days by default
  const endDate = new Date();
  const startDate = subDays(endDate, 7);

  const { data, isLoading } = useAuditLogs({
    entityType: entityTypeFilter || undefined,
    action: searchQuery || undefined,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    page,
    limit: 20,
  });

  const handleEntityTypeChange = (entityType: string) => {
    setEntityTypeFilter(entityType);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (entityType) {
      params.set('entityType', entityType);
    } else {
      params.delete('entityType');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historique des actions</h1>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleEntityTypeChange('')}
              className={`px-3 py-1 text-sm rounded-full ${!entityTypeFilter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tout
            </button>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleEntityTypeChange(value)}
                className={`px-3 py-1 text-sm rounded-full ${entityTypeFilter === value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.logs && data.logs.length > 0 ? (
                    data.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {format(new Date(log.timestamp), 'dd MMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss', { locale: fr })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {log.admin.firstName} {log.admin.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{log.admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ENTITY_LABELS[log.entityType] || log.entityType}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {log.entityId.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.payload && (
                            <div className="text-xs text-gray-600 max-w-xs">
                              <pre className="bg-gray-50 rounded p-2 overflow-auto">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        Aucun historique trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (data.pagination.totalPages ?? data.pagination.pages) > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.totalPages ?? data.pagination.pages} ({data.pagination.total} entrées)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= (data.pagination.totalPages ?? data.pagination.pages)}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
