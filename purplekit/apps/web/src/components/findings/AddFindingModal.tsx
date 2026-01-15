import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const findingSchema = z.object({
  engagementId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pillar: z.enum(['PEOPLE', 'PROCESS', 'TECHNOLOGY'], {
    required_error: 'Pillar is required',
  }),
  category: z.enum([
    'TELEMETRY_GAP',
    'DETECTION_GAP',
    'PREVENTION_GAP',
    'TOOL_MISCONFIGURATION',
    'INTEGRATION_ISSUE',
    'MISSING_PLAYBOOK',
    'PLAYBOOK_NOT_FOLLOWED',
    'ESCALATION_FAILURE',
    'COMMUNICATION_GAP',
    'DOCUMENTATION_GAP',
    'SKILLS_GAP',
    'CAPACITY_ISSUE',
    'AWARENESS_GAP',
  ], { required_error: 'Category is required' }),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], {
    required_error: 'Severity is required',
  }),
  recommendation: z.string().optional(),
  remediationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

type FindingFormData = z.infer<typeof findingSchema>;

interface AddFindingModalProps {
  engagementId: string;
  onClose: () => void;
  prefillData?: {
    techniqueId?: string;
    description?: string;
  };
}

// Category groupings by pillar
const CATEGORIES_BY_PILLAR = {
  TECHNOLOGY: [
    { value: 'TELEMETRY_GAP', label: 'Telemetry Gap' },
    { value: 'DETECTION_GAP', label: 'Detection Gap' },
    { value: 'PREVENTION_GAP', label: 'Prevention Gap' },
    { value: 'TOOL_MISCONFIGURATION', label: 'Tool Misconfiguration' },
    { value: 'INTEGRATION_ISSUE', label: 'Integration Issue' },
  ],
  PROCESS: [
    { value: 'MISSING_PLAYBOOK', label: 'Missing Playbook' },
    { value: 'PLAYBOOK_NOT_FOLLOWED', label: 'Playbook Not Followed' },
    { value: 'ESCALATION_FAILURE', label: 'Escalation Failure' },
    { value: 'COMMUNICATION_GAP', label: 'Communication Gap' },
    { value: 'DOCUMENTATION_GAP', label: 'Documentation Gap' },
  ],
  PEOPLE: [
    { value: 'SKILLS_GAP', label: 'Skills Gap' },
    { value: 'CAPACITY_ISSUE', label: 'Capacity Issue' },
    { value: 'AWARENESS_GAP', label: 'Awareness Gap' },
  ],
};

export function AddFindingModal({
  engagementId,
  onClose,
  prefillData,
}: AddFindingModalProps) {
  const queryClient = useQueryClient();
  const [selectedPillar, setSelectedPillar] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FindingFormData>({
    defaultValues: {
      engagementId,
      title: '',
      description: prefillData?.description || '',
      pillar: undefined,
      category: undefined,
      severity: undefined,
      recommendation: '',
      remediationEffort: undefined,
    },
  });

  // Fetch engagement techniques for relatedTechniqueIds
  const { data: techniquesData } = useQuery({
    queryKey: ['engagement-techniques', engagementId],
    queryFn: async () => {
      const response = await api.get(`/engagements/${engagementId}/techniques?limit=100`);
      return response.data;
    },
  });

  const techniques = techniquesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: FindingFormData) => {
      const payload: any = {
        ...data,
      };

      // Add prefill technique if provided
      if (prefillData?.techniqueId) {
        payload.relatedTechniqueIds = [prefillData.techniqueId];
      }

      return api.post('/findings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast.success('Finding created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create finding');
    },
  });

  const onSubmit = (data: FindingFormData) => {
    createMutation.mutate(data);
  };

  const pillar = watch('pillar');
  const availableCategories = pillar ? CATEGORIES_BY_PILLAR[pillar as keyof typeof CATEGORIES_BY_PILLAR] : [];

  // Reset category when pillar changes
  const handlePillarChange = (newPillar: string) => {
    setSelectedPillar(newPillar);
    setValue('category', undefined as any);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Document Finding</h2>
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              className="input w-full"
              placeholder="Brief summary of the finding..."
              maxLength={255}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              {...register('description')}
              className="input w-full"
              rows={5}
              placeholder="Detailed description of the security gap, what was observed, and the impact..."
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Pillar and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pillar (PPT Framework) <span className="text-red-600">*</span>
              </label>
              <select
                {...register('pillar', {
                  onChange: (e) => handlePillarChange(e.target.value),
                })}
                className="input w-full"
              >
                <option value="">Select pillar...</option>
                <option value="PEOPLE">People</option>
                <option value="PROCESS">Process</option>
                <option value="TECHNOLOGY">Technology</option>
              </select>
              {errors.pillar && (
                <p className="text-xs text-red-600 mt-1">{errors.pillar.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                {...register('category')}
                className="input w-full"
                disabled={!pillar}
              >
                <option value="">Select category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Severity and Remediation Effort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-600">*</span>
              </label>
              <select {...register('severity')} className="input w-full">
                <option value="">Select severity...</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
              {errors.severity && (
                <p className="text-xs text-red-600 mt-1">{errors.severity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remediation Effort
              </label>
              <select {...register('remediationEffort')} className="input w-full">
                <option value="">Select effort...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendation
            </label>
            <textarea
              {...register('recommendation')}
              className="input w-full"
              rows={3}
              placeholder="Recommended actions to address this gap..."
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
            <AlertTriangle className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Finding'}
          </button>
        </div>
      </div>
    </div>
  );
}
