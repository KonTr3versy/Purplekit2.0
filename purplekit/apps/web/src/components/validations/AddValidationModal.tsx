import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const validationSchema = z.object({
  outcome: z.enum(['LOGGED', 'ALERTED', 'PREVENTED', 'NOT_LOGGED'], {
    required_error: 'Outcome is required',
  }),
  detectedAt: z.string().optional(),
  dataSource: z.string().max(255).optional(),
  query: z.string().optional(),
  alertName: z.string().max(255).optional(),
  alertPriority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  falsePositive: z.boolean().optional(),
  notes: z.string().optional(),
});

type ValidationFormData = z.infer<typeof validationSchema>;

interface AddValidationModalProps {
  actionId: string;
  techniqueId: string;
  onClose: () => void;
}

export function AddValidationModal({
  actionId,
  techniqueId,
  onClose,
}: AddValidationModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ValidationFormData>({
    defaultValues: {
      outcome: undefined,
      detectedAt: '',
      dataSource: '',
      query: '',
      alertName: '',
      alertPriority: undefined,
      falsePositive: false,
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ValidationFormData) => {
      const payload: any = {
        actionId,
        outcome: data.outcome,
        falsePositive: data.falsePositive || false,
      };

      if (data.detectedAt) payload.detectedAt = new Date(data.detectedAt).toISOString();
      if (data.dataSource) payload.dataSource = data.dataSource;
      if (data.query) payload.query = data.query;
      if (data.alertName) payload.alertName = data.alertName;
      if (data.alertPriority) payload.alertPriority = data.alertPriority;
      if (data.notes) payload.notes = data.notes;

      return api.post('/validations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['validations', actionId] });
      toast.success('Validation created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create validation');
    },
  });

  const onSubmit = (data: ValidationFormData) => {
    createMutation.mutate(data);
  };

  const outcome = watch('outcome');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Validate Detection</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={createMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Outcome - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="LOGGED"
                  {...register('outcome')}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Logged</div>
                  <div className="text-sm text-gray-600">
                    Action was logged but no alert was generated
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="ALERTED"
                  {...register('outcome')}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Alerted</div>
                  <div className="text-sm text-gray-600">
                    Action was detected and an alert was generated
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="PREVENTED"
                  {...register('outcome')}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Prevented</div>
                  <div className="text-sm text-gray-600">
                    Action was blocked or prevented by defensive controls
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="NOT_LOGGED"
                  {...register('outcome')}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Not Logged</div>
                  <div className="text-sm text-gray-600">
                    Action was not detected or logged by any defensive tool
                  </div>
                </div>
              </label>
            </div>
            {errors.outcome && (
              <p className="text-xs text-red-600 mt-1">{errors.outcome.message}</p>
            )}
          </div>

          {/* Detection Time */}
          {outcome && outcome !== 'NOT_LOGGED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detection Time
              </label>
              <input
                type="datetime-local"
                {...register('detectedAt')}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                When was this action detected?
              </p>
            </div>
          )}

          {/* Data Source */}
          {outcome && outcome !== 'NOT_LOGGED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Source
              </label>
              <input
                type="text"
                {...register('dataSource')}
                className="input w-full"
                placeholder="e.g., Windows Event Logs, Sysmon, EDR telemetry"
                maxLength={255}
              />
              <p className="text-xs text-gray-500 mt-1">
                Where was this action logged?
              </p>
            </div>
          )}

          {/* Alert Details */}
          {outcome === 'ALERTED' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Name
                </label>
                <input
                  type="text"
                  {...register('alertName')}
                  className="input w-full"
                  placeholder="Name of the alert that fired"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Priority
                </label>
                <select {...register('alertPriority')} className="input w-full">
                  <option value="">Select priority...</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
            </>
          )}

          {/* Detection Query */}
          {outcome && outcome !== 'NOT_LOGGED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detection Query/Rule
              </label>
              <textarea
                {...register('query')}
                className="input w-full font-mono text-sm"
                rows={4}
                placeholder="Detection rule, query, or signature that identified this action..."
              />
            </div>
          )}

          {/* False Positive */}
          {outcome && outcome !== 'NOT_LOGGED' && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('falsePositive')}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mark as false positive
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Check if this detection was a false positive
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              className="input w-full"
              rows={3}
              placeholder="Additional observations, context, or recommendations..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="btn-primary flex items-center gap-2"
            disabled={createMutation.isPending}
          >
            <CheckCircle className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Validation'}
          </button>
        </div>
      </div>
    </div>
  );
}
