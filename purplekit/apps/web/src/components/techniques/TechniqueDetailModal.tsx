import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink, Target, Server, Database, Layers } from 'lucide-react';
import { api } from '@/lib/api';

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

interface TechniqueDetailModalProps {
  technique: AttackTechnique;
  onClose: () => void;
}

export function TechniqueDetailModal({ technique, onClose }: TechniqueDetailModalProps) {
  // If this is a parent technique, fetch subtechniques
  const { data: subtechniquesData } = useQuery({
    queryKey: ['subtechniques', technique.id],
    queryFn: async () => {
      if (technique.isSubtechnique) return null;
      const response = await api.get(`/attack/techniques?parentId=${technique.id}`);
      return response.data;
    },
    enabled: !technique.isSubtechnique,
  });

  const subtechniques = subtechniquesData?.data || [];

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const mitreUrl = technique.mitreUrl || `https://attack.mitre.org/techniques/${technique.id.replace('.', '/')}/`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {technique.id}: {technique.name}
            </h2>
            {technique.isSubtechnique && (
              <p className="text-sm text-gray-500 mt-1">Sub-technique</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed">{technique.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tactics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Tactics
              </h3>
              <div className="flex flex-wrap gap-2">
                {technique.tactics.map((tactic) => (
                  <span
                    key={tactic}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {tactic.split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {technique.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            {technique.dataSources && technique.dataSources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {technique.dataSources.map((source) => (
                    <span
                      key={source}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Version Info */}
            {technique.version && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Version
                </h3>
                <p className="text-gray-700 text-sm">{technique.version}</p>
              </div>
            )}
          </div>

          {/* Subtechniques */}
          {!technique.isSubtechnique && subtechniques.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Sub-techniques ({subtechniques.length})
              </h3>
              <div className="space-y-2">
                {subtechniques.map((sub: AttackTechnique) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-sm text-purple-600 font-medium">
                          {sub.id}
                        </span>
                        <h4 className="font-medium text-gray-900 mt-1">{sub.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            MITRE ATT&CK Technique {technique.id}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
            <a
              href={mitreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on MITRE ATT&CK
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
