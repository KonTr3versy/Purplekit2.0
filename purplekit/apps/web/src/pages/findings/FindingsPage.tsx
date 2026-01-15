import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { FindingCard } from '@/components/findings/FindingCard';
import { AddFindingModal } from '@/components/findings/AddFindingModal';

export function FindingsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    engagementId: '',
    pillar: '',
    category: '',
    severity: '',
    status: '',
  });

  // Fetch engagements for filter dropdown
  const { data: engagementsData } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      const response = await api.get('/engagements?limit=100');
      return response.data;
    },
  });

  const engagements = engagementsData?.data || [];

  // Fetch findings
  const { data, isLoading, error } = useQuery({
    queryKey: ['findings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.engagementId) params.append('engagementId', filters.engagementId);
      if (filters.pillar) params.append('pillar', filters.pillar);
      if (filters.category) params.append('category', filters.category);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', '100');

      const response = await api.get(`/findings?${params}`);
      return response.data;
    },
  });

  const findings = data?.data || [];

  // Calculate stats
  const stats = {
    total: findings.length,
    critical: findings.filter((f: any) => f.severity === 'CRITICAL').length,
    high: findings.filter((f: any) => f.severity === 'HIGH').length,
    open: findings.filter((f: any) => f.status === 'OPEN').length,
    inProgress: findings.filter((f: any) => f.status === 'IN_PROGRESS').length,
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      engagementId: '',
      pillar: '',
      category: '',
      severity: '',
      status: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading findings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load findings</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Findings</h1>
          <p className="text-gray-600">
            Security gaps and recommendations from purple team engagements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Finding
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High</p>
              <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm flex items-center gap-2 ${
              showFilters ? 'bg-purple-50 text-purple-700' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                {Object.values(filters).filter((v) => v !== '').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-5 gap-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Engagement
              </label>
              <select
                value={filters.engagementId}
                onChange={(e) => handleFilterChange('engagementId', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Engagements</option>
                {engagements.map((eng: any) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pillar</label>
              <select
                value={filters.pillar}
                onChange={(e) => handleFilterChange('pillar', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Pillars</option>
                <option value="PEOPLE">People</option>
                <option value="PROCESS">Process</option>
                <option value="TECHNOLOGY">Technology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="WONT_FIX">Won't Fix</option>
                <option value="DEFERRED">Deferred</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Categories</option>
                <optgroup label="Technology">
                  <option value="TELEMETRY_GAP">Telemetry Gap</option>
                  <option value="DETECTION_GAP">Detection Gap</option>
                  <option value="PREVENTION_GAP">Prevention Gap</option>
                  <option value="TOOL_MISCONFIGURATION">Tool Misconfiguration</option>
                  <option value="INTEGRATION_ISSUE">Integration Issue</option>
                </optgroup>
                <optgroup label="Process">
                  <option value="MISSING_PLAYBOOK">Missing Playbook</option>
                  <option value="PLAYBOOK_NOT_FOLLOWED">Playbook Not Followed</option>
                  <option value="ESCALATION_FAILURE">Escalation Failure</option>
                  <option value="COMMUNICATION_GAP">Communication Gap</option>
                  <option value="DOCUMENTATION_GAP">Documentation Gap</option>
                </optgroup>
                <optgroup label="People">
                  <option value="SKILLS_GAP">Skills Gap</option>
                  <option value="CAPACITY_ISSUE">Capacity Issue</option>
                  <option value="AWARENESS_GAP">Awareness Gap</option>
                </optgroup>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Findings List */}
      {findings.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {hasActiveFilters ? 'No findings match your filters' : 'No findings yet'}
          </p>
          {!hasActiveFilters && (
            <p className="text-sm text-gray-400 mb-4">
              Document security gaps discovered during purple team engagements
            </p>
          )}
          {!hasActiveFilters && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Finding
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {findings.map((finding: any) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddModal && (
        <AddFindingModal
          engagementId={filters.engagementId || engagements[0]?.id || ''}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
