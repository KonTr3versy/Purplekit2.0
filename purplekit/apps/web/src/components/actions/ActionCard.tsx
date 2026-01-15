import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { AddValidationModal } from '../validations/AddValidationModal';
import { ValidationDetailsCard } from '../validations/ValidationDetailsCard';

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
    outcome: 'LOGGED' | 'ALERTED' | 'PREVENTED' | 'NOT_LOGGED';
    detectedAt: string | null;
    dataSource: string | null;
    query: string | null;
    alertName: string | null;
    alertPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | null;
    falsePositive: boolean;
    notes: string | null;
    validatedBy: {
      id: string;
      displayName: string;
      email: string;
    };
    validatedAt: string;
  };
}

interface ActionCardProps {
  action: Action;
  techniqueId: string;
}

export function ActionCard({ action, techniqueId }: ActionCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editForm, setEditForm] = useState({
    command: action.command || '',
    targetHost: action.targetHost || '',
    targetUser: action.targetUser || '',
    notes: action.notes || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      command?: string | null;
      targetHost?: string | null;
      targetUser?: string | null;
      notes?: string | null;
    }) => api.patch(`/actions/${action.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      setIsEditing(false);
      toast.success('Action updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update action');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/actions/${action.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['actions-count', techniqueId] });
      toast.success('Action deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete action');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      command: editForm.command || null,
      targetHost: editForm.targetHost || null,
      targetUser: editForm.targetUser || null,
      notes: editForm.notes || null,
    });
  };

  const handleCancel = () => {
    setEditForm({
      command: action.command || '',
      targetHost: action.targetHost || '',
      targetUser: action.targetUser || '',
      notes: action.notes || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getOutcomeBadgeColor = (outcome: string) => {
    switch (outcome) {
      case 'LOGGED':
        return 'bg-blue-100 text-blue-800';
      case 'ALERTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREVENTED':
        return 'bg-red-100 text-red-800';
      case 'NOT_LOGGED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const commandPreview = action.command?.slice(0, 100) || '';
  const hasLongCommand = (action.command?.length || 0) > 100;

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Timestamp Icon */}
        <div className="mt-1">
          <Clock className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(action.executedAt), 'PPp')}
                </span>
                {action.validation ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Validated</span>
                  </div>
                ) : !isEditing ? (
                  <button
                    onClick={() => setShowValidationModal(true)}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Validate Action
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">Pending Validation</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Executed by {action.executedBy.displayName}
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

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-3 pt-3 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Command
                </label>
                <textarea
                  value={editForm.command}
                  onChange={(e) => setEditForm({ ...editForm, command: e.target.value })}
                  className="input w-full font-mono text-sm"
                  rows={3}
                  placeholder="Command executed..."
                  maxLength={10000}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Host
                  </label>
                  <input
                    type="text"
                    value={editForm.targetHost}
                    onChange={(e) => setEditForm({ ...editForm, targetHost: e.target.value })}
                    className="input w-full"
                    placeholder="hostname or IP"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target User
                  </label>
                  <input
                    type="text"
                    value={editForm.targetUser}
                    onChange={(e) => setEditForm({ ...editForm, targetUser: e.target.value })}
                    className="input w-full"
                    placeholder="username"
                    maxLength={255}
                  />
                </div>
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
                  placeholder="Additional notes..."
                  maxLength={5000}
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
          ) : (
            /* Display View */
            <div className="space-y-2">
              {/* Command */}
              {action.command && (
                <div>
                  <label className="text-xs text-gray-600 font-medium">Command</label>
                  <div className="bg-gray-100 p-2 rounded mt-1">
                    <code className="block text-sm font-mono text-gray-900 whitespace-pre-wrap break-all">
                      {isExpanded || !hasLongCommand ? action.command : commandPreview}
                      {!isExpanded && hasLongCommand && '...'}
                    </code>
                    {hasLongCommand && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Show more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Target Info */}
              {(action.targetHost || action.targetUser) && (
                <div className="grid grid-cols-2 gap-3">
                  {action.targetHost && (
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Target Host</label>
                      <p className="text-sm text-gray-900 mt-0.5">{action.targetHost}</p>
                    </div>
                  )}
                  {action.targetUser && (
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Target User</label>
                      <p className="text-sm text-gray-900 mt-0.5">{action.targetUser}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {action.notes && (
                <div className="pt-2 border-t">
                  <label className="text-xs text-gray-600 font-medium">Notes</label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{action.notes}</p>
                </div>
              )}

              {/* Validation Details */}
              {action.validation && (
                <div className="pt-3">
                  <ValidationDetailsCard
                    validation={action.validation}
                    techniqueId={techniqueId}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Action?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this action? This cannot be undone.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Validation Modal */}
      {showValidationModal && (
        <AddValidationModal
          actionId={action.id}
          techniqueId={techniqueId}
          onClose={() => setShowValidationModal(false)}
        />
      )}
    </div>
  );
}
