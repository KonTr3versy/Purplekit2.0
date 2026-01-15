import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, CheckCircle2, Circle } from 'lucide-react';
import { api } from '@/lib/api';

interface AttackTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  isSubtechnique: boolean;
  deprecated: boolean;
}

interface TechniquesBrowserProps {
  selectedTechniques: string[];
  onToggleSelect: (techniqueId: string) => void;
  excludeTechniqueIds?: string[];
}

const TACTICS = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
];

const PLATFORMS = [
  'Windows',
  'Linux',
  'macOS',
  'AWS',
  'Azure',
  'GCP',
  'Office 365',
  'Azure AD',
  'SaaS',
  'IaaS',
  'Network',
  'Containers',
];

export function TechniquesBrowser({
  selectedTechniques,
  onToggleSelect,
  excludeTechniqueIds = [],
}: TechniquesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tacticFilter, setTacticFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch techniques
  const { data, isLoading } = useQuery({
    queryKey: ['attack-techniques', { search: searchQuery, tactic: tacticFilter, platform: platformFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (tacticFilter) params.append('tactic', tacticFilter);
      if (platformFilter) params.append('platform', platformFilter);
      params.append('includeSubtechniques', 'true');
      params.append('includeDeprecated', 'false');
      params.append('limit', '100');

      const response = await api.get(`/attack/techniques?${params}`);
      return response.data;
    },
  });

  const techniques = data?.data || [];
  const availableTechniques = techniques.filter(
    (t: AttackTechnique) => !excludeTechniqueIds.includes(t.id)
  );

  const isSelected = (techniqueId: string) => selectedTechniques.includes(techniqueId);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search techniques by ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-purple-50 text-purple-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tactic
              </label>
              <select
                value={tacticFilter}
                onChange={(e) => setTacticFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Tactics</option>
                {TACTICS.map((tactic) => (
                  <option key={tactic} value={tactic}>
                    {tactic.split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Platforms</option>
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setTacticFilter('');
                setPlatformFilter('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {isLoading ? 'Loading...' : `${availableTechniques.length} techniques available`}
        </span>
        {selectedTechniques.length > 0 && (
          <span className="text-purple-600 font-medium">
            {selectedTechniques.length} selected
          </span>
        )}
      </div>

      {/* Techniques Grid */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading techniques...</div>
        ) : availableTechniques.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No techniques found matching your criteria
          </div>
        ) : (
          availableTechniques.map((technique: AttackTechnique) => (
            <button
              key={technique.id}
              onClick={() => onToggleSelect(technique.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                isSelected(technique.id)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isSelected(technique.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-mono text-sm text-purple-600 font-medium">
                        {technique.id}
                      </span>
                      {technique.isSubtechnique && (
                        <span className="ml-2 text-xs text-gray-500">(Sub-technique)</span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{technique.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {technique.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {technique.tactics.slice(0, 3).map((tactic) => (
                      <span
                        key={tactic}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tactic}
                      </span>
                    ))}
                    {technique.tactics.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        +{technique.tactics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
