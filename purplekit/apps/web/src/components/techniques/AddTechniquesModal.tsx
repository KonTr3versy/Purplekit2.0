import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { TechniquesBrowser } from './TechniquesBrowser';

interface AddTechniquesModalProps {
  engagementId: string;
  existingTechniqueIds: string[];
  onClose: () => void;
}

export function AddTechniquesModal({
  engagementId,
  existingTechniqueIds,
  onClose,
}: AddTechniquesModalProps) {
  const queryClient = useQueryClient();
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);

  const addMutation = useMutation({
    mutationFn: (techniqueIds: string[]) =>
      api.post(`/engagements/${engagementId}/techniques/bulk`, { techniqueIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['engagement-techniques', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast.success(`Added ${response.data.added} technique(s) successfully`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to add techniques');
    },
  });

  const handleToggleSelect = (techniqueId: string) => {
    setSelectedTechniques((prev) =>
      prev.includes(techniqueId)
        ? prev.filter((id) => id !== techniqueId)
        : [...prev, techniqueId]
    );
  };

  const handleAdd = () => {
    if (selectedTechniques.length === 0) {
      toast.error('Please select at least one technique');
      return;
    }
    addMutation.mutate(selectedTechniques);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add ATT&CK Techniques</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={addMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Browser Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <TechniquesBrowser
            selectedTechniques={selectedTechniques}
            onToggleSelect={handleToggleSelect}
            excludeTechniqueIds={existingTechniqueIds}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTechniques.length > 0 ? (
              <span>
                {selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>Select techniques to add to this engagement</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={addMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary flex items-center gap-2"
              disabled={addMutation.isPending || selectedTechniques.length === 0}
            >
              <Plus className="w-4 h-4" />
              {addMutation.isPending
                ? 'Adding...'
                : `Add ${selectedTechniques.length || ''} Technique${selectedTechniques.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
