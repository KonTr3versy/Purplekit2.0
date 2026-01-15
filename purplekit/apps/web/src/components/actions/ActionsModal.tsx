import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { AddActionForm } from './AddActionForm';
import { ActionsList } from './ActionsList';

interface ActionsModalProps {
  engagementId: string;
  techniqueId: string;
  technique: {
    id: string;
    name: string;
  };
  onClose: () => void;
}

export function ActionsModal({
  engagementId,
  techniqueId,
  technique,
  onClose,
}: ActionsModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['actions', techniqueId],
    queryFn: async () => {
      const response = await api.get(
        `/actions?engagementTechniqueId=${techniqueId}&limit=100`
      );
      return response.data;
    },
  });

  const actions = data?.data || [];

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Actions</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-mono text-purple-600">{technique.id}</span> - {technique.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Action Form */}
          <AddActionForm
            techniqueId={techniqueId}
            engagementId={engagementId}
          />

          {/* Actions List */}
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load actions</p>
            </div>
          ) : (
            <ActionsList
              actions={actions}
              techniqueId={techniqueId}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
