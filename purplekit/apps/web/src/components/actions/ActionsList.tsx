import { useState, useMemo } from 'react';
import { Filter, SortAsc } from 'lucide-react';
import { ActionCard } from './ActionCard';

interface Action {
  id: string;
  engagementTechniqueId: string;
  executedAt: string;
  executedById: string;
  command: string | null;
  targetHost: string | null;
  targetUser: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  executedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  validation?: {
    id: string;
    actionId: string;
    outcomes: ('LOGGED' | 'ALERTED' | 'PREVENTED' | 'NOT_LOGGED')[];
    alertPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | null;
    validatedBy: {
      id: string;
      displayName: string;
      email: string;
    };
    validatedAt: string;
  };
}

interface ActionsListProps {
  actions: Action[];
  techniqueId: string;
  isLoading: boolean;
}

export function ActionsList({ actions, techniqueId, isLoading }: ActionsListProps) {
  const [showValidatedOnly, setShowValidatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const sortedAndFilteredActions = useMemo(() => {
    let filtered = actions;

    // Filter by validation status
    if (showValidatedOnly) {
      filtered = filtered.filter((a) => a.validation);
    }

    // Sort by executedAt
    return filtered.sort((a, b) => {
      const aTime = new Date(a.executedAt).getTime();
      const bTime = new Date(b.executedAt).getTime();
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [actions, showValidatedOnly, sortBy]);

  const validatedCount = actions.filter((a) => a.validation).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading actions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {actions.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{actions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Validated</p>
                <p className="text-2xl font-bold text-green-600">{validatedCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">
                  {actions.length - validatedCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowValidatedOnly(!showValidatedOnly)}
            className={`btn-secondary text-sm flex items-center gap-2 ${
              showValidatedOnly ? 'bg-purple-50 text-purple-700' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            {showValidatedOnly ? 'Validated Only' : 'All Actions'}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="input text-sm px-3 py-1.5"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {sortedAndFilteredActions.length} {sortedAndFilteredActions.length === 1 ? 'action' : 'actions'}
          {showValidatedOnly && ` (validated)`}
        </div>
      </div>

      {/* Actions List */}
      {sortedAndFilteredActions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">
            {showValidatedOnly
              ? 'No validated actions yet'
              : 'No actions logged yet'}
          </p>
          {!showValidatedOnly && (
            <p className="text-sm text-gray-400">
              Click "Log Action" to record the first execution
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAndFilteredActions.map((action) => (
            <ActionCard key={action.id} action={action} techniqueId={techniqueId} />
          ))}
        </div>
      )}
    </div>
  );
}
