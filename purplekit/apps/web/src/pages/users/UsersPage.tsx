import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { Navigate } from 'react-router-dom';
import { Plus, Search, Filter, Users as UsersIcon, UserCheck, Shield, UserX, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { UserRoleBadge } from '@/components/users/UserRoleBadge';
import { UserStatusBadge } from '@/components/users/UserStatusBadge';

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  });

  // Permission check
  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive) params.append('isActive', filters.isActive);
      params.append('limit', '100');

      const response = await api.get(`/users?${params}`);
      return response.data;
    },
  });

  const users = data?.data || [];

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u: any) => u.isActive).length,
    admins: users.filter((u: any) => u.role === 'ADMIN').length,
    inactive: users.filter((u: any) => !u.isActive).length,
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      isActive: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastLogin = (lastLoginAt: string | null) => {
    if (!lastLoginAt) {
      return <span className="text-yellow-600 text-xs">Never logged in</span>;
    }
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load users</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">
            Manage user accounts and permissions for your organization
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <UserX className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm flex items-center gap-2 ${
              showFilters ? 'bg-purple-50 text-purple-700' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                {Object.values(filters).filter((v) => v !== '').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Search className="w-3 h-3 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Email or name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="RED_LEAD">Red Lead</option>
                <option value="BLUE_LEAD">Blue Lead</option>
                <option value="ANALYST">Analyst</option>
                <option value="OBSERVER">Observer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {hasActiveFilters ? 'No users match your filters' : 'No users yet'}
          </p>
          {!hasActiveFilters && (
            <p className="text-sm text-gray-400 mb-4">
              Invite team members to collaborate on purple team engagements
            </p>
          )}
          {!hasActiveFilters && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Invite First User
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEditUser(user)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {getInitials(user.displayName)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 text-xs text-gray-500">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserStatusBadge isActive={user.isActive} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastLogin(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
