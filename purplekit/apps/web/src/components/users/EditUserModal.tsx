import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { X, Save, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const updateUserSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['ADMIN', 'RED_LEAD', 'BLUE_LEAD', 'ANALYST', 'OBSERVER'], {
    required_error: 'Role is required',
  }),
  isActive: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface EditUserModalProps {
  user: any;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isEditingSelf = currentUser?.id === user.id;
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    defaultValues: {
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserFormData) => {
      return api.patch(`/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update user';
      toast.error(message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => {
      return api.delete(`/users/${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to deactivate user';
      toast.error(message);
    },
  });

  const onSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate(data);
  };

  const handleDeactivate = () => {
    if (showDeactivateConfirm) {
      deactivateMutation.mutate();
    } else {
      setShowDeactivateConfirm(true);
      setTimeout(() => setShowDeactivateConfirm(false), 3000);
    }
  };

  const formatLastLogin = (lastLoginAt: string | null) => {
    if (!lastLoginAt) {
      return 'Never';
    }
    return new Date(lastLoginAt).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500 mt-1">
              Update user information and permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={updateMutation.isPending || deactivateMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              className="input w-full bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register('displayName')}
              className="input w-full"
              placeholder="John Doe"
              maxLength={100}
            />
            {errors.displayName && (
              <p className="text-xs text-red-600 mt-1">{errors.displayName.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              {...register('role')}
              className="input w-full"
              disabled={isEditingSelf}
            >
              <option value="ANALYST">Analyst - Regular team member</option>
              <option value="RED_LEAD">Red Lead - Red team leader</option>
              <option value="BLUE_LEAD">Blue Lead - Blue team leader</option>
              <option value="ADMIN">Admin - Full administrative access</option>
              <option value="OBSERVER">Observer - Read-only access</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
            )}
            {isEditingSelf && (
              <p className="text-xs text-gray-500 mt-1">
                You cannot change your own role
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('isActive')}
                  value="true"
                  disabled={isEditingSelf}
                  className="mr-2"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('isActive')}
                  value="false"
                  disabled={isEditingSelf}
                  className="mr-2"
                />
                <span className="text-sm">Inactive</span>
              </label>
            </div>
            {isEditingSelf && (
              <p className="text-xs text-gray-500 mt-1">
                You cannot deactivate yourself
              </p>
            )}
          </div>

          {/* Last Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Login
            </label>
            <div className="text-sm text-gray-600">
              {formatLastLogin(user.lastLoginAt)}
            </div>
          </div>

          {/* Warning if editing self */}
          {isEditingSelf && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                You are editing your own account. Role and status changes are restricted for
                security reasons.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {!isEditingSelf && user.isActive && (
              <button
                type="button"
                onClick={handleDeactivate}
                className={`flex items-center gap-2 text-sm ${
                  showDeactivateConfirm
                    ? 'text-red-700 font-semibold'
                    : 'text-red-600 hover:text-red-700'
                }`}
                disabled={updateMutation.isPending || deactivateMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
                {showDeactivateConfirm
                  ? 'Click again to confirm'
                  : deactivateMutation.isPending
                  ? 'Deactivating...'
                  : 'Deactivate User'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={updateMutation.isPending || deactivateMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              className="btn-primary flex items-center gap-2"
              disabled={updateMutation.isPending || deactivateMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
