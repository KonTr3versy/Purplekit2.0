import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const actionSchema = z.object({
  executedAt: z.string().min(1, 'Execution time is required'),
  command: z.string().max(10000, 'Command must be less than 10000 characters').optional(),
  targetHost: z.string().max(255, 'Target host must be less than 255 characters').optional(),
  targetUser: z.string().max(255, 'Target user must be less than 255 characters').optional(),
  notes: z.string().max(5000, 'Notes must be less than 5000 characters').optional(),
});

type ActionFormData = z.infer<typeof actionSchema>;

interface AddActionFormProps {
  techniqueId: string;
  engagementId: string;
  onSuccess?: () => void;
}

export function AddActionForm({ techniqueId, engagementId, onSuccess }: AddActionFormProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionFormData>({
    defaultValues: {
      executedAt: new Date().toISOString().slice(0, 16), // Current datetime in local format
      command: '',
      targetHost: '',
      targetUser: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ActionFormData) =>
      api.post('/actions', {
        ...data,
        engagementTechniqueId: techniqueId,
        executedAt: new Date(data.executedAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['actions-count', techniqueId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-techniques', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast.success('Action logged successfully');
      reset({
        executedAt: new Date().toISOString().slice(0, 16),
        command: '',
        targetHost: '',
        targetUser: '',
        notes: '',
      });
      setIsExpanded(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to log action');
    },
  });

  const onSubmit = (data: ActionFormData) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsExpanded(false);
  };

  return (
    <div className="card p-4">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Action
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Log New Action</h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={createMutation.isPending}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Time <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('executedAt')}
              className="input w-full"
            />
            {errors.executedAt && (
              <p className="text-xs text-red-600 mt-1">{errors.executedAt.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
            <textarea
              {...register('command')}
              className="input w-full font-mono text-sm"
              rows={4}
              placeholder="Enter the command or action executed..."
              maxLength={10000}
            />
            {errors.command && (
              <p className="text-xs text-red-600 mt-1">{errors.command.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Host
              </label>
              <input
                type="text"
                {...register('targetHost')}
                className="input w-full"
                placeholder="hostname or IP address"
                maxLength={255}
              />
              {errors.targetHost && (
                <p className="text-xs text-red-600 mt-1">{errors.targetHost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target User
              </label>
              <input
                type="text"
                {...register('targetUser')}
                className="input w-full"
                placeholder="username"
                maxLength={255}
              />
              {errors.targetUser && (
                <p className="text-xs text-red-600 mt-1">{errors.targetUser.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              className="input w-full"
              rows={3}
              placeholder="Additional notes, observations, or context..."
              maxLength={5000}
            />
            {errors.notes && (
              <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1"
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={createMutation.isPending}
            >
              <Plus className="w-4 h-4" />
              {createMutation.isPending ? 'Logging...' : 'Log Action'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
