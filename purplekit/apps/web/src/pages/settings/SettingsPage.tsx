import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, FileText, Shield, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { OrganizationSettings } from '@/types/settings';

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Fetch settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data as OrganizationSettings;
    },
  });

  // Mutation for updates
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<OrganizationSettings>) => {
      const response = await api.patch('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Success feedback will be shown by individual cards
    },
    onError: (error: any) => {
      console.error('Failed to update settings:', error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your organization configuration</p>
        {!isAdmin && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You are viewing settings in read-only mode. Contact an administrator to make changes.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Organization Info (Read-only) */}
        <OrganizationInfoCard />

        {/* Profile Settings */}
        {settings && (
          <>
            <ProfileSettingsCard
              settings={settings.profile}
              isAdmin={isAdmin}
              onSave={(data) => updateMutation.mutate({ profile: data })}
              isSaving={updateMutation.isPending}
            />

            {/* Report Defaults */}
            <ReportSettingsCard
              settings={settings.reports}
              isAdmin={isAdmin}
              onSave={(data) => updateMutation.mutate({ reports: data })}
              isSaving={updateMutation.isPending}
            />

            {/* Security Settings */}
            <SecuritySettingsCard
              settings={settings.security}
              isAdmin={isAdmin}
              onSave={(data) => updateMutation.mutate({ security: data })}
              isSaving={updateMutation.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Organization Info Card (Read-only)
function OrganizationInfoCard() {
  const currentUser = useAuthStore((state) => state.user);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Building className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Organization Name</label>
          <p className="text-gray-900 mt-1">{currentUser?.organization?.name || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Subscription Tier</label>
          <p className="text-gray-900 mt-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {currentUser?.organization?.subscriptionTier || 'FREE'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Card
interface ProfileSettingsCardProps {
  settings: OrganizationSettings['profile'];
  isAdmin: boolean;
  onSave: (data: OrganizationSettings['profile']) => void;
  isSaving: boolean;
}

function ProfileSettingsCard({ settings, isAdmin, onSave, isSaving }: ProfileSettingsCardProps) {
  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={!isAdmin}
            className="input w-full"
            rows={3}
            placeholder="Describe your organization..."
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            disabled={!isAdmin}
            className="input w-full"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <div className="space-y-2">
            {[
              { value: 'ISO', label: 'ISO (2024-01-15)' },
              { value: 'US', label: 'US (01/15/2024)' },
              { value: 'EU', label: 'EU (15/01/2024)' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.dateFormat === option.value}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as 'ISO' | 'US' | 'EU' })}
                  disabled={!isAdmin}
                  className="text-purple-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <div className="space-y-2">
            {[
              { value: '12h', label: '12-hour (3:45 PM)' },
              { value: '24h', label: '24-hour (15:45)' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.timeFormat === option.value}
                  onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value as '12h' | '24h' })}
                  disabled={!isAdmin}
                  className="text-purple-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between items-center pt-4">
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved successfully!</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary ml-auto"
            >
              {isSaving ? 'Saving...' : 'Save Profile Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Report Settings Card
interface ReportSettingsCardProps {
  settings: OrganizationSettings['reports'];
  isAdmin: boolean;
  onSave: (data: OrganizationSettings['reports']) => void;
  isSaving: boolean;
}

function ReportSettingsCard({ settings, isAdmin, onSave, isSaving }: ReportSettingsCardProps) {
  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Report Defaults</h2>
      </div>

      <div className="space-y-4">
        {/* Default Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Report Type
          </label>
          <div className="space-y-2">
            {[
              { value: 'TACTICAL', label: 'Tactical', desc: 'Technical details for analysts' },
              { value: 'OPERATIONAL', label: 'Operational', desc: 'Balanced technical and business view' },
              { value: 'STRATEGIC', label: 'Strategic', desc: 'Executive summary for leadership' }
            ].map((option) => (
              <label key={option.value} className="flex items-start gap-2">
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.defaultType === option.value}
                  onChange={(e) => setFormData({ ...formData, defaultType: e.target.value as 'TACTICAL' | 'OPERATIONAL' | 'STRATEGIC' })}
                  disabled={!isAdmin}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Default Report Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Export Format
          </label>
          <div className="space-y-2">
            {[
              { value: 'pdf', label: 'PDF' },
              { value: 'html', label: 'HTML' },
              { value: 'docx', label: 'Word (DOCX)' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.defaultFormat === option.value}
                  onChange={(e) => setFormData({ ...formData, defaultFormat: e.target.value as 'pdf' | 'html' | 'docx' })}
                  disabled={!isAdmin}
                  className="text-purple-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between items-center pt-4">
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved successfully!</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary ml-auto"
            >
              {isSaving ? 'Saving...' : 'Save Report Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Security Settings Card
interface SecuritySettingsCardProps {
  settings: OrganizationSettings['security'];
  isAdmin: boolean;
  onSave: (data: OrganizationSettings['security']) => void;
  isSaving: boolean;
}

function SecuritySettingsCard({ settings, isAdmin, onSave, isSaving }: SecuritySettingsCardProps) {
  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Session Timeout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={formData.sessionTimeoutMinutes}
            onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) || 0 })}
            disabled={!isAdmin}
            min={15}
            max={10080}
            className="input w-32"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-logout after inactivity (15 min to 7 days)
          </p>
        </div>

        {/* Password Change on First Login */}
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.requirePasswordChangeOnFirstLogin}
              onChange={(e) => setFormData({ ...formData, requirePasswordChangeOnFirstLogin: e.target.checked })}
              disabled={!isAdmin}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <div className="text-sm font-medium text-gray-700">
                Require password change on first login
              </div>
              <div className="text-xs text-gray-500">
                New users must change their temporary password
              </div>
            </div>
          </label>
        </div>

        {isAdmin && (
          <div className="flex justify-between items-center pt-4">
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved successfully!</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary ml-auto"
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
