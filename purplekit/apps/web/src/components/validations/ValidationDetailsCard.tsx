import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Edit2, Trash2, Save, X, CheckCircle2, AlertCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { api } from '@/lib/api';

interface Validation {
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
}

interface ValidationDetailsCardProps {
  validation: Validation;
  techniqueId: string;
}

export function ValidationDetailsCard({ validation, techniqueId }: ValidationDetailsCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      outcome: validation.outcome,
      detectedAt: validation.detectedAt ? new Date(validation.detectedAt).toISOString().slice(0, 16) : '',
      dataSource: validation.dataSource || '',
      query: validation.query || '',
      alertName: validation.alertName || '',
      alertPriority: validation.alertPriority || '',
      falsePositive: validation.falsePositive,
      notes: validation.notes || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = {
        outcome: data.outcome,
        falsePositive: data.falsePositive,
      };

      if (data.detectedAt) payload.detectedAt = new Date(data.detectedAt).toISOString();
      else payload.detectedAt = null;

      payload.dataSource = data.dataSource || null;
      payload.query = data.query || null;
      payload.alertName = data.alertName || null;
      payload.alertPriority = data.alertPriority || null;
      payload.notes = data.notes || null;

      return api.patch(`/validations/${validation.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['validations', validation.actionId] });
      setIsEditing(false);
      toast.success('Validation updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update validation');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/validations/${validation.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['validations', validation.actionId] });
      toast.success('Validation deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete validation');
    },
  });

  const handleSave = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getOutcomeConfig = (outcome: string) => {
    switch (outcome) {
      case 'LOGGED':
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, iconColor: 'text-blue-600' };
      case 'ALERTED':
        return { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, iconColor: 'text-yellow-600' };
      case 'PREVENTED':
        return { color: 'bg-red-100 text-red-800', icon: ShieldCheck, iconColor: 'text-red-600' };
      case 'NOT_LOGGED':
        return { color: 'bg-gray-100 text-gray-800', icon: ShieldOff, iconColor: 'text-gray-600' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, iconColor: 'text-gray-600' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'INFO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentOutcome = watch('outcome');
  const outcomeConfig = getOutcomeConfig(isEditing ? currentOutcome : validation.outcome);
  const OutcomeIcon = outcomeConfig.icon;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <OutcomeIcon className={`w-5 h-5 ${outcomeConfig.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-900">Detection Validation</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${outcomeConfig.color}`}>
                  {isEditing ? currentOutcome : validation.outcome}
                </span>
                {validation.falsePositive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    False Positive
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Validated by {validation.validatedBy.displayName} on{' '}
                {format(new Date(validation.validatedAt), 'PPp')}
              </p>
            </div>

            {!isEditing && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded"
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
            <form onSubmit={handleSubmit(handleSave)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select {...register('outcome')} className="input w-full text-sm">
                  <option value="LOGGED">Logged</option>
                  <option value="ALERTED">Alerted</option>
                  <option value="PREVENTED">Prevented</option>
                  <option value="NOT_LOGGED">Not Logged</option>
                </select>
              </div>

              {currentOutcome !== 'NOT_LOGGED' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detection Time
                      </label>
                      <input
                        type="datetime-local"
                        {...register('detectedAt')}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Source
                      </label>
                      <input
                        type="text"
                        {...register('dataSource')}
                        className="input w-full text-sm"
                        placeholder="e.g., Sysmon, EDR"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  {currentOutcome === 'ALERTED' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alert Name
                        </label>
                        <input
                          type="text"
                          {...register('alertName')}
                          className="input w-full text-sm"
                          maxLength={255}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select {...register('alertPriority')} className="input w-full text-sm">
                          <option value="">None</option>
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                          <option value="INFO">Info</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detection Query/Rule
                    </label>
                    <textarea
                      {...register('query')}
                      className="input w-full font-mono text-xs"
                      rows={3}
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('falsePositive')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Mark as false positive</span>
                  </label>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  className="input w-full text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary text-sm flex items-center gap-1"
                  disabled={updateMutation.isPending}
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm flex items-center gap-1"
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-3 h-3" />
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            /* Display View */
            <div className="space-y-2 text-sm">
              {validation.detectedAt && (
                <div>
                  <span className="font-medium text-gray-700">Detected:</span>{' '}
                  <span className="text-gray-900">
                    {format(new Date(validation.detectedAt), 'PPp')}
                  </span>
                </div>
              )}

              {validation.dataSource && (
                <div>
                  <span className="font-medium text-gray-700">Data Source:</span>{' '}
                  <span className="text-gray-900">{validation.dataSource}</span>
                </div>
              )}

              {validation.alertName && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Alert:</span>
                  <span className="text-gray-900">{validation.alertName}</span>
                  {validation.alertPriority && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(validation.alertPriority)}`}>
                      {validation.alertPriority}
                    </span>
                  )}
                </div>
              )}

              {validation.query && (
                <div>
                  <span className="font-medium text-gray-700">Detection Rule:</span>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs font-mono text-gray-900 whitespace-pre-wrap break-all">
                    {validation.query}
                  </pre>
                </div>
              )}

              {validation.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>{' '}
                  <span className="text-gray-700">{validation.notes}</span>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Validation?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this validation? This action cannot be undone.
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
    </div>
  );
}
