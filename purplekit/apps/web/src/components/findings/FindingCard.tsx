import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { api } from '@/lib/api';

interface Finding {
  id: string;
  engagementId: string;
  title: string;
  description: string;
  pillar: 'PEOPLE' | 'PROCESS' | 'TECHNOLOGY';
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX' | 'DEFERRED';
  recommendation: string | null;
  remediationEffort: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  createdBy: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FindingCardProps {
  finding: Finding;
}

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

export function FindingCard({ finding }: FindingCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: finding.title,
      description: finding.description,
      pillar: finding.pillar,
      category: finding.category,
      severity: finding.severity,
      status: finding.status,
      recommendation: finding.recommendation || '',
      remediationEffort: finding.remediationEffort || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = { ...data };
      if (!payload.recommendation) payload.recommendation = null;
      if (!payload.remediationEffort) payload.remediationEffort = null;
      return api.patch(`/findings/${finding.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      setIsEditing(false);
      toast.success('Finding updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update finding');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/findings/${finding.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      toast.success('Finding deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete finding');
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, iconColor: 'text-red-600' };
      case 'HIGH':
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, iconColor: 'text-orange-600' };
      case 'MEDIUM':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' };
      case 'LOW':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertTriangle, iconColor: 'text-blue-600' };
      case 'INFO':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle, iconColor: 'text-gray-600' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle, iconColor: 'text-gray-600' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { color: 'bg-red-100 text-red-800', icon: AlertTriangle };
      case 'IN_PROGRESS':
        return { color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'RESOLVED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'WONT_FIX':
        return { color: 'bg-gray-100 text-gray-800', icon: Ban };
      case 'DEFERRED':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Calendar };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'PEOPLE':
        return 'bg-purple-100 text-purple-800';
      case 'PROCESS':
        return 'bg-indigo-100 text-indigo-800';
      case 'TECHNOLOGY':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const allCategories = [...CATEGORIES_BY_PILLAR.PEOPLE, ...CATEGORIES_BY_PILLAR.PROCESS, ...CATEGORIES_BY_PILLAR.TECHNOLOGY];
    return allCategories.find(c => c.value === category)?.label || category;
  };

  const severityConfig = getSeverityConfig(finding.severity);
  const statusConfig = getStatusConfig(finding.status);
  const SeverityIcon = severityConfig.icon;
  const StatusIcon = statusConfig.icon;

  const pillar = watch('pillar');
  const availableCategories = pillar ? CATEGORIES_BY_PILLAR[pillar as keyof typeof CATEGORIES_BY_PILLAR] : [];

  return (
    <div className={`card p-4 border-l-4 ${severityConfig.color.includes('red') ? 'border-l-red-500' : severityConfig.color.includes('orange') ? 'border-l-orange-500' : severityConfig.color.includes('yellow') ? 'border-l-yellow-500' : severityConfig.color.includes('blue') ? 'border-l-blue-500' : 'border-l-gray-500'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <SeverityIcon className={`w-5 h-5 ${severityConfig.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color}`}>
                  {finding.severity}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {finding.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPillarColor(finding.pillar)}`}>
                  {finding.pillar}
                </span>
                <span className="text-xs text-gray-500">
                  {getCategoryLabel(finding.category)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{finding.title}</h3>
              <p className="text-xs text-gray-600">
                Created by {finding.createdBy.displayName} on {format(new Date(finding.createdAt), 'PPp')}
              </p>
            </div>

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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-3 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  {...register('title', { required: true, minLength: 3, maxLength: 255 })}
                  className="input w-full text-sm"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description', { required: true })}
                  className="input w-full text-sm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
                  <select
                    {...register('pillar', {
                      onChange: (e) => setValue('category', ''),
                    })}
                    className="input w-full text-sm"
                  >
                    <option value="PEOPLE">People</option>
                    <option value="PROCESS">Process</option>
                    <option value="TECHNOLOGY">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select {...register('category')} className="input w-full text-sm">
                    {availableCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select {...register('severity')} className="input w-full text-sm">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="input w-full text-sm">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="WONT_FIX">Won't Fix</option>
                    <option value="DEFERRED">Deferred</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remediation Effort
                  </label>
                  <select {...register('remediationEffort')} className="input w-full text-sm">
                    <option value="">Not set</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation
                </label>
                <textarea
                  {...register('recommendation')}
                  className="input w-full text-sm"
                  rows={2}
                  placeholder="Recommended actions..."
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
              <p className="text-gray-700 whitespace-pre-wrap">{finding.description}</p>

              {finding.recommendation && (
                <div className="pt-2 border-t">
                  <label className="text-xs text-gray-600 font-medium">Recommendation:</label>
                  <p className="text-gray-700 mt-1">{finding.recommendation}</p>
                </div>
              )}

              {finding.remediationEffort && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 font-medium">Remediation Effort:</label>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    finding.remediationEffort === 'HIGH' ? 'bg-red-100 text-red-800' :
                    finding.remediationEffort === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {finding.remediationEffort}
                  </span>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Finding?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this finding? This action cannot be undone.
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
