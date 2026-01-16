import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Shield, Layers, Target, Server, X as XIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { TechniqueBrowseCard } from '@/components/techniques/TechniqueBrowseCard';
import { TechniqueDetailModal } from '@/components/techniques/TechniqueDetailModal';

interface AttackTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  dataSources?: string[];
  isSubtechnique: boolean;
  deprecated: boolean;
  parentTechniqueId?: string | null;
  mitreUrl?: string;
  version?: string;
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

export function TechniquesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tacticFilter, setTacticFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<AttackTechnique | null>(null);
  const [techniques, setTechniques] = useState<AttackTechnique[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch techniques
  const { data, isLoading } = useQuery({
    queryKey: ['techniques-browse', { search: searchQuery, tactic: tacticFilter, platform: platformFilter }],
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

  // Reset pagination when filters change
  useEffect(() => {
    if (data) {
      setTechniques(data.data);
      setCursor(data.meta?.cursor || null);
    }
  }, [data]);

  // Calculate stats
  const stats = {
    total: techniques.length,
    subtechniques: techniques.filter(t => t.isSubtechnique).length,
    tactics: new Set(techniques.flatMap(t => t.tactics)).size,
    platforms: new Set(techniques.flatMap(t => t.platforms)).size,
  };

  // Load more handler
  const loadMore = async () => {
    if (!cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (tacticFilter) params.append('tactic', tacticFilter);
      if (platformFilter) params.append('platform', platformFilter);
      params.append('cursor', cursor);
      params.append('includeSubtechniques', 'true');
      params.append('includeDeprecated', 'false');
      params.append('limit', '100');

      const response = await api.get(`/attack/techniques?${params}`);
      setTechniques(prev => [...prev, ...response.data.data]);
      setCursor(response.data.meta?.cursor || null);
    } catch (error) {
      console.error('Failed to load more techniques:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTacticFilter('');
    setPlatformFilter('');
  };

  const hasActiveFilters = searchQuery || tacticFilter || platformFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MITRE ATT&CK Techniques</h1>
        <p className="text-gray-600 mt-1">
          Browse the complete catalog of adversary tactics and techniques
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Techniques</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">Active in database</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Sub-techniques</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.subtechniques}</p>
              <p className="text-xs text-gray-500 mt-1">Detailed variations</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tactics Coverage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.tactics}</p>
              <p className="text-xs text-gray-500 mt-1">Unique tactics</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Platforms Coverage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.platforms}</p>
              <p className="text-xs text-gray-500 mt-1">Unique platforms</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Server className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card p-4 space-y-4">
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
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? 'bg-purple-50 text-purple-700 border-purple-300' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <XIcon className="w-3 h-3" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {isLoading ? 'Loading...' : `${techniques.length} techniques found`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <XIcon className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Techniques Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="text-gray-500 mt-4">Loading techniques...</p>
          </div>
        ) : techniques.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No techniques found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techniques.map((technique) => (
                <TechniqueBrowseCard
                  key={technique.id}
                  technique={technique}
                  onClick={setSelectedTechnique}
                />
              ))}
            </div>

            {/* Load More Button */}
            {cursor && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-200 border-t-purple-600 mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    'Load more techniques'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTechnique && (
        <TechniqueDetailModal
          technique={selectedTechnique}
          onClose={() => setSelectedTechnique(null)}
        />
      )}
    </div>
  );
}
