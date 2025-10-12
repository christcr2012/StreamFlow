'use client';

import { useState, useEffect } from 'react';

type Permission = {
  id: string;
  code: string;
  description: string | null;
};

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: Permission[];
};

type User = {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
};

export default function RBACAdminPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Role creation state
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // User role assignment state
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'roles') {
        const res = await fetch('/api/provider/rbac/roles');
        const data = await res.json();
        setRoles(data.roles || []);
      } else if (activeTab === 'permissions') {
        const res = await fetch('/api/provider/rbac/permissions');
        const data = await res.json();
        setPermissions(data.permissions || []);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/provider/rbac/users');
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createRole() {
    setError('');
    setSuccess('');
    
    if (!newRoleName || !newRoleSlug) {
      setError('Role name and slug are required');
      return;
    }
    
    try {
      const res = await fetch('/api/provider/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          slug: newRoleSlug,
          permissionIds: selectedPermissions,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create role');
      }
      
      setSuccess('Role created successfully');
      setShowCreateRole(false);
      setNewRoleName('');
      setNewRoleSlug('');
      setSelectedPermissions([]);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteRole(roleId: string) {
    if (!confirm('Are you sure you want to delete this role?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/provider/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete role');
      }
      
      setSuccess('Role deleted successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function assignRoleToUser() {
    setError('');
    setSuccess('');
    
    if (!selectedUser || !selectedRole) {
      setError('Please select both user and role');
      return;
    }
    
    try {
      const res = await fetch('/api/provider/rbac/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          roleId: selectedRole,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign role');
      }
      
      setSuccess('Role assigned successfully');
      setSelectedUser('');
      setSelectedRole('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function removeUserRole(userId: string, roleId: string) {
    if (!confirm('Are you sure you want to remove this role from the user?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/provider/rbac/user-roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove role');
      }
      
      setSuccess('Role removed successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">RBAC Administration</h1>
        <p className="text-gray-600 mb-8">
          Manage roles, permissions, and user access control.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'permissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              User Assignments
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Roles</h2>
                  <button
                    onClick={() => setShowCreateRole(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Role
                  </button>
                </div>

                {showCreateRole && (
                  <div className="mb-6 p-6 bg-white border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Role Name</label>
                        <input
                          type="text"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="e.g., Content Manager"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Slug</label>
                        <input
                          type="text"
                          value={newRoleSlug}
                          onChange={(e) => setNewRoleSlug(e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="e.g., content-manager"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Permissions</label>
                        <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-2">
                          {permissions.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPermissions([...selectedPermissions, perm.id]);
                                  } else {
                                    setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                                  }
                                }}
                              />
                              <span className="text-sm">{perm.code}</span>
                              {perm.description && (
                                <span className="text-xs text-gray-500">- {perm.description}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={createRole}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateRole(false);
                            setNewRoleName('');
                            setNewRoleSlug('');
                            setSelectedPermissions([]);
                          }}
                          className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{role.name}</h3>
                          <p className="text-sm text-gray-600">Slug: {role.slug}</p>
                          {role.isSystem && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              System Role
                            </span>
                          )}
                        </div>
                        {!role.isSystem && (
                          <button
                            onClick={() => deleteRole(role.id)}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Permissions ({role.permissions.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((perm) => (
                            <span
                              key={perm.id}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                            >
                              {perm.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Permissions</h2>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {permissions.map((perm) => (
                        <tr key={perm.id}>
                          <td className="px-4 py-3 text-sm font-mono">{perm.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{perm.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">User Role Assignments</h2>
                
                <div className="mb-6 p-6 bg-white border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Assign Role to User</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">User</label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email} {user.name && `(${user.name})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select role...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={assignRoleToUser}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Assign Role
                  </button>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 bg-white border rounded-lg">
                      <div className="mb-3">
                        <h3 className="font-semibold">{user.email}</h3>
                        {user.name && <p className="text-sm text-gray-600">{user.name}</p>}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Roles ({user.roles.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded"
                            >
                              <span className="text-sm">{role.name}</span>
                              {!role.isSystem && (
                                <button
                                  onClick={() => removeUserRole(user.id, role.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove role"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-sm text-gray-500">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

