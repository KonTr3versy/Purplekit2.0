import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  User,
  Target,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

// Engagement type
interface Engagement {
  id: string;
  name: string;
  description: string | null;
  methodology: 'ATOMIC' | 'SCENARIO';
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETE' | 'ARCHIVED';
  visibilityMode: 'OPEN' | 'BLIND_BLUE' | 'BLIND_RED';
  isTemplate: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  stats: {
    techniqueCount: number;
    completionPercent: number;
    statusCounts: Record<string, number>;
  };
}

// Update form schema
const updateEngagementSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETE', 'ARCHIVED']).optional(),
  visibilityMode: z.enum(['OPEN', 'BLIND_BLUE', 'BLIND_RED']).optional(),
});

type UpdateEngagementForm = z.infer<typeof updateEngagementSchema>;

export function EngagementDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch engagement
  const { data: engagement, isLoading, error } = useQuery<Engagement>({
    queryKey: ['engagement', id],
    queryFn: async () => {
      const response = await api.get(`/engagements/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Update engagement mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateEngagementForm) => api.patch(`/engagements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement', id] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      setIsEditing(false);
      toast.success('Engagement updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update engagement');
    },
  });

  // Delete engagement mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/engagements/${id}`),
    onSuccess: () => {
      toast.success('Engagement archived successfully');
      navigate('/engagements');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to archive engagement');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEngagementForm>({
    defaultValues: engagement,
  });

  const onSubmit = (data: UpdateEngagementForm) => {
    updateMutation.mutate(data);
  };

  const handleEdit = () => {
    if (engagement) {
      reset({
        name: engagement.name,
        description: engagement.description || '',
        status: engagement.status,
        visibilityMode: engagement.visibilityMode,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-gray-100 text-gray-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETE':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load engagement</p>
        <button onClick={() => navigate('/engagements')} className="btn-secondary">
          Back to Engagements
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/engagements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Engagements
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {engagement.name}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  engagement.status
                )}`}
              >
                {engagement.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {engagement.methodology}
              </span>
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <button onClick={handleEdit} className="btn-secondary flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isEditing ? (
        /* Edit Form */
        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input {...register('name')} className="input w-full" />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                className="input w-full"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select {...register('status')} className="input w-full">
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility Mode
                </label>
                <select {...register('visibilityMode')} className="input w-full">
                  <option value="OPEN">Open</option>
                  <option value="BLIND_BLUE">Blind Blue</option>
                  <option value="BLIND_RED">Blind Red</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary flex items-center gap-2"
                disabled={updateMutation.isPending}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Detail View */
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Techniques</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {engagement.stats.techniqueCount}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {engagement.stats.completionPercent}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Complete</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {engagement.stats.statusCounts.COMPLETE || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(engagement.stats.statusCounts.EXECUTING || 0) +
                      (engagement.stats.statusCounts.VALIDATING || 0)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">
                  {engagement.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Visibility Mode</label>
                  <p className="text-gray-900 mt-1">{engagement.visibilityMode}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created By</label>
                  <p className="text-gray-900 mt-1">{engagement.createdBy.displayName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(engagement.createdAt), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(engagement.updatedAt), 'PPP')}
                  </p>
                </div>
              </div>

              {engagement.startedAt && (
                <div>
                  <label className="text-sm text-gray-600">Started</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(engagement.startedAt), 'PPP')}
                  </p>
                </div>
              )}

              {engagement.completedAt && (
                <div>
                  <label className="text-sm text-gray-600">Completed</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(engagement.completedAt), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Techniques Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Techniques</h2>
              <button
                onClick={() => navigate(`/engagements/${id}/techniques`)}
                className="btn-primary text-sm"
              >
                Manage Techniques
              </button>
            </div>
            <p className="text-gray-500 text-center py-8">
              Navigate to Techniques tab to add and manage ATT&CK techniques for this engagement.
              <br />
              <span className="text-sm">
                (Full techniques management UI coming in next update)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Archive Engagement?</h2>
            <p className="text-gray-600 mb-6">
              This will archive the engagement. You can still access it later by filtering
              for archived engagements.
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
                {deleteMutation.isPending ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
