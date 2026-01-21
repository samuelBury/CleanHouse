// Page de gestion des urgences
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, AlertTriangle, CheckCircle, UserCheck, Phone, MapPin, Clock, RefreshCw } from 'lucide-react';
import { useUrgencies, useUrgencyStats, useAssignUrgency, useResolveUrgency } from '../hooks/useApi';
import type { UrgencyType, UrgencySeverity, UrgencyStatus } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_LABELS: Record<UrgencyType, string> = {
  no_show: 'Non-présentation',
  lateness: 'Retard',
  cancellation: 'Annulation',
  complaint: 'Réclamation',
};

const SEVERITY_LABELS: Record<UrgencySeverity, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

const STATUS_LABELS: Record<UrgencyStatus, string> = {
  pending: 'En attente',
  assigned: 'Prise en charge',
  resolved: 'Résolue',
};

const SEVERITY_COLORS: Record<UrgencySeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_COLORS: Record<UrgencyStatus, string> = {
  pending: 'bg-red-100 text-red-800',
  assigned: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

const SEVERITY_BADGE_COLORS: Record<UrgencySeverity, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-gray-500 text-white',
};

export default function Urgencies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<UrgencyStatus | ''>(
    (searchParams.get('status') as UrgencyStatus) || ''
  );
  const [severityFilter, setSeverityFilter] = useState<UrgencySeverity | ''>(
    (searchParams.get('severity') as UrgencySeverity) || ''
  );

  const { data, isLoading, refetch } = useUrgencies({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });
  const { data: stats } = useUrgencyStats();
  const assignMutation = useAssignUrgency();
  const resolveMutation = useResolveUrgency();

  const handleStatusFilterChange = (status: UrgencyStatus | '') => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
  };

  const handleSeverityFilterChange = (severity: UrgencySeverity | '') => {
    setSeverityFilter(severity);
    const params = new URLSearchParams(searchParams);
    if (severity) {
      params.set('severity', severity);
    } else {
      params.delete('severity');
    }
    setSearchParams(params);
  };

  const handleAssign = async (urgencyId: string) => {
    try {
      await assignMutation.mutateAsync(urgencyId);
    } catch (error) {
      console.error('Error assigning urgency:', error);
      alert("Erreur lors de la prise en charge");
    }
  };

  const handleResolve = async (urgencyId: string) => {
    if (!confirm('Marquer cette urgence comme résolue ?')) return;
    try {
      await resolveMutation.mutateAsync(urgencyId);
    } catch (error) {
      console.error('Error resolving urgency:', error);
      alert("Erreur lors de la résolution");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Urgences</h1>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                <p className="text-sm text-gray-500">Prises en charge</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                <p className="text-sm text-gray-500">Résolues</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Actives</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {(Object.entries(STATUS_LABELS) as [UrgencyStatus, string][]).map(([value, label]) => (
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
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sévérité:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSeverityFilterChange('')}
              className={`px-3 py-1 text-sm rounded-full ${!severityFilter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Toutes
            </button>
            {(Object.entries(SEVERITY_LABELS) as [UrgencySeverity, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleSeverityFilterChange(value)}
                className={`px-3 py-1 text-sm rounded-full ${severityFilter === value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des urgences */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : data?.urgencies && data.urgencies.length > 0 ? (
          data.urgencies.map((urgency) => (
            <div
              key={urgency.id}
              className={`bg-white rounded-lg shadow border-l-4 p-4 ${SEVERITY_COLORS[urgency.severity]}`}
            >
              <div className="flex flex-wrap gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${SEVERITY_BADGE_COLORS[urgency.severity]}`}>
                      {SEVERITY_LABELS[urgency.severity]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {TYPE_LABELS[urgency.type]}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[urgency.status]}`}>
                      {STATUS_LABELS[urgency.status]}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Mission</p>
                      <p className="text-sm font-medium">
                        {format(new Date(urgency.mission.booking.date), 'dd MMM yyyy', { locale: fr })} - {urgency.mission.booking.time}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{urgency.mission.booking.address}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="text-sm font-medium">{urgency.mission.booking.user?.name}</p>
                      {urgency.mission.booking.user?.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {urgency.mission.booking.user.phone}
                        </p>
                      )}
                    </div>
                    {urgency.mission.professional && (
                      <div>
                        <p className="text-sm text-gray-500">Professionnel</p>
                        <p className="text-sm font-medium">
                          {urgency.mission.professional.firstName} {urgency.mission.professional.lastName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {urgency.mission.professional.phone}
                        </p>
                      </div>
                    )}
                    {urgency.description && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-sm text-gray-700">{urgency.description}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Créée {formatDistanceToNow(new Date(urgency.createdAt), { addSuffix: true, locale: fr })}
                    {urgency.resolvedBy && ` - Résolue par ${urgency.resolvedBy.firstName} ${urgency.resolvedBy.lastName}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {urgency.status === 'pending' && (
                    <button
                      onClick={() => handleAssign(urgency.id)}
                      disabled={assignMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Prendre en charge
                    </button>
                  )}
                  {urgency.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(urgency.id)}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Résoudre
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune urgence trouvée
          </div>
        )}
      </div>

      {/* Pagination info */}
      {data?.pagination && data.pagination.total > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          {data.pagination.total} urgence{data.pagination.total > 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  );
}
