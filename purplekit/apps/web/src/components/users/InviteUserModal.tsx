import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { X, UserPlus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['ADMIN', 'RED_LEAD', 'BLUE_LEAD', 'ANALYST', 'OBSERVER'], {
    required_error: 'Role is required',
  }),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface InviteUserModalProps {
  onClose: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    defaultValues: {
      email: '',
      displayName: '',
      role: 'ANALYST',
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteUserFormData) => {
      return api.post('/users', data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Invitation sent to ${response.data.email}`, {
        icon: '📧',
      });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to invite user';
      toast.error(message);
    },
  });

  const onSubmit = (data: InviteUserFormData) => {
    inviteMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invite User</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add a new team member to your organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={inviteMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className="input w-full"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
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
            <select {...register('role')} className="input w-full">
              <option value="ANALYST">Analyst - Regular team member</option>
              <option value="RED_LEAD">Red Lead - Red team leader</option>
              <option value="BLUE_LEAD">Blue Lead - Blue team leader</option>
              <option value="ADMIN">Admin - Full administrative access</option>
              <option value="OBSERVER">Observer - Read-only access</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Choose the appropriate role based on the user's responsibilities
            </p>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              An email will be sent with temporary login credentials. The user will be prompted
              to change their password on first login.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={inviteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="btn-primary flex items-center gap-2"
            disabled={inviteMutation.isPending}
          >
            <UserPlus className="w-4 h-4" />
            {inviteMutation.isPending ? 'Sending Invite...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
