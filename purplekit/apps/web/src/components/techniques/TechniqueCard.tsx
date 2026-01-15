import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ActionsModal } from '../actions/ActionsModal';

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

interface TechniqueCardProps {
  engagementId: string;
  technique: EngagementTechnique;
}

export function TechniqueCard({ engagementId, technique }: TechniqueCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: technique.status,
    notes: technique.notes || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; notes?: string | null }) =>
      api.patch(`/engagements/${engagementId}/techniques/${technique.techniqueId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-techniques', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      setIsEditing(false);
      toast.success('Technique updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update technique');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete(`/engagements/${engagementId}/techniques/${technique.techniqueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-techniques', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast.success('Technique removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to remove technique');
    },
  });

  // Fetch action count
  const { data: actionsData } = useQuery({
    queryKey: ['actions-count', technique.id],
    queryFn: async () => {
      const response = await api.get(
        `/actions?engagementTechniqueId=${technique.id}&limit=1`
      );
      return response.data;
    },
  });
  const actionCount = actionsData?.meta?.total || 0;

  const handleSave = () => {
    updateMutation.mutate({
      status: editForm.status,
      notes: editForm.notes || null,
    });
  };

  const handleCancel = () => {
    setEditForm({
      status: technique.status,
      notes: technique.notes || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
        };
      case 'EXECUTING':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: PlayCircle,
          iconColor: 'text-blue-600',
        };
      case 'VALIDATING':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          iconColor: 'text-yellow-600',
        };
      case 'COMPLETE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
        };
    }
  };

  const statusConfig = getStatusConfig(isEditing ? editForm.status : technique.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-1">
          <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-purple-600 font-medium">
                  {technique.technique.id}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                >
                  {isEditing ? editForm.status : technique.status}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                {technique.technique.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {technique.technique.description}
              </p>
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tactics */}
          <div className="flex flex-wrap gap-1 mb-3">
            {technique.technique.tactics.map((tactic) => (
              <span
                key={tactic}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tactic}
              </span>
            ))}
          </div>

          {/* Actions Button */}
          {!isEditing && (
            <button
              onClick={() => setShowActionsModal(true)}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 mb-3"
            >
              <FileText className="w-4 h-4" />
              {actionCount} {actionCount === 1 ? 'Action' : 'Actions'}
            </button>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="EXECUTING">Executing</option>
                  <option value="VALIDATING">Validating</option>
                  <option value="COMPLETE">Complete</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Add notes about this technique..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="btn-secondary flex items-center gap-1 text-sm"
                  disabled={updateMutation.isPending}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-1 text-sm"
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Notes Display (when not editing) */}
          {!isEditing && technique.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {technique.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Technique?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove <strong>{technique.technique.name}</strong> from this engagement?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {showActionsModal && (
        <ActionsModal
          engagementId={engagementId}
          techniqueId={technique.id}
          technique={technique.technique}
          onClose={() => setShowActionsModal(false)}
        />
      )}
    </div>
  );
}
