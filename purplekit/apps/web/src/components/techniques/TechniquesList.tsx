import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, SortAsc } from 'lucide-react';
import { api } from '@/lib/api';
import { TechniqueCard } from './TechniqueCard';

interface EngagementTechnique {
  id: string;
  techniqueId: string;
  status: 'PLANNED' | 'EXECUTING' | 'VALIDATING' | 'COMPLETE';
  orderIndex: number;
  assignedToId: string | null;
  notes: string | null;
  technique: {
    id: string;
    name: string;
    description: string;
    tactics: string[];
    platforms: string[];
  };
  assignedTo?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

interface TechniquesListProps {
  engagementId: string;
}

export function TechniquesList({ engagementId }: TechniquesListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'orderIndex' | 'status'>('orderIndex');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['engagement-techniques', engagementId, { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');

      const response = await api.get(`/engagements/${engagementId}/techniques?${params}`);
      return response.data;
    },
  });

  const techniques = data?.data || [];

  // Sort techniques
  const sortedTechniques = [...techniques].sort((a, b) => {
    if (sortBy === 'orderIndex') {
      return a.orderIndex - b.orderIndex;
    } else {
      const statusOrder = ['PLANNED', 'EXECUTING', 'VALIDATING', 'COMPLETE'];
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    }
  });

  // Group by status for stats
  const statusCounts = techniques.reduce((acc: Record<string, number>, technique: EngagementTechnique) => {
    acc[technique.status] = (acc[technique.status] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading techniques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load techniques</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {techniques.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{techniques.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-gray-600">{statusCounts.PLANNED || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Executing</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.EXECUTING || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Validating</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.VALIDATING || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Complete</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.COMPLETE || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Bar */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-purple-50 text-purple-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button
          onClick={() => setSortBy(sortBy === 'orderIndex' ? 'status' : 'orderIndex')}
          className="btn-secondary flex items-center gap-2"
        >
          <SortAsc className="w-4 h-4" />
          Sort by: {sortBy === 'orderIndex' ? 'Order' : 'Status'}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === ''
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PLANNED')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'PLANNED'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => setStatusFilter('EXECUTING')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'EXECUTING'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Executing
              </button>
              <button
                onClick={() => setStatusFilter('VALIDATING')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'VALIDATING'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Validating
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETE')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'COMPLETE'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Techniques Grid */}
      {sortedTechniques.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">
            {statusFilter
              ? `No techniques found with status: ${statusFilter}`
              : 'No techniques added yet'}
          </p>
          {!statusFilter && (
            <p className="text-sm text-gray-400">
              Click "Add Techniques" to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedTechniques.map((technique: EngagementTechnique) => (
            <TechniqueCard
              key={technique.id}
              engagementId={engagementId}
              technique={technique}
            />
          ))}
        </div>
      )}
    </div>
  );
}
