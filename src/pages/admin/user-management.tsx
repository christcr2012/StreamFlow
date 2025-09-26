// src/pages/admin/user-management.tsx
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  employeeProfile: {
    id: string;
    adpWorkerId: string | null;
    managerId: string | null;
    emergencyContact: any;
  } | null;
  rbacUserRoles: Array<{
    role: {
      name: string;
      slug: string;
    };
  }>;
}

interface NewUserForm {
  email: string;
  name: string;
  role: string;
  generatePassword: boolean;
  password: string;
  employeeData: {
    adpWorkerId: string;
    managerId: string;
    emergencyContact: any;
  };
}

export default function UserManagementPage() {
  const { me } = useMe();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    email: "",
    name: "",
    role: "STAFF",
    generatePassword: true,
    password: "",
    employeeData: {
      adpWorkerId: "",
      managerId: "",
      emergencyContact: {}
    }
  });

  // Check permissions using proper RBAC
  const canManageUsers = hasPerm(me, PERMS.USER_CREATE) || me?.role === "OWNER";
  const canResetPasswords = hasPerm(me, PERMS.PASSWORD_RESET) || me?.role === "OWNER";

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      
      if (data.ok) {
        setUsers(data.users);
      } else {
        console.error("Failed to fetch users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setShowCreateForm(false);
        setNewUserForm({
          email: "",
          name: "",
          role: "STAFF",
          generatePassword: true,
          password: "",
          employeeData: {
            adpWorkerId: "",
            managerId: "",
            emergencyContact: {}
          }
        });
        fetchUsers();
        
        if (data.user.temporaryPassword) {
          alert(`User created successfully! Temporary password: ${data.user.temporaryPassword}`);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password?")) return;
    
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, generatePassword: true })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        alert(`Password reset successfully! New password: ${data.temporaryPassword}`);
        fetchUsers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.ok) {
        fetchUsers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      alert("Failed to deactivate user");
    }
  };

  if (!canManageUsers) {
    return (
      <div className="responsive-container">
        <div className="responsive-card text-center">
          <h1 className="responsive-heading-1 text-red-400 mb-4">Access Denied</h1>
          <p className="text-white">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>User Management - Business OS</title></Head>
      
      <div className="responsive-container space-y-6">
        {/* Header */}
        <div className="responsive-flex-col-row-lg items-start lg:items-center justify-between responsive-gap">
          <div>
            <h1 className="responsive-heading-1 text-gradient">User Management</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Manage user accounts, permissions, and employee information
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="touch-button bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent"
          >
            Create New User
          </button>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="responsive-card text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{users.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Users</div>
          </div>
          <div className="responsive-card text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Users</div>
          </div>
          <div className="responsive-card text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {users.filter(u => u.mustChangePassword).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Password Reset Required</div>
          </div>
          <div className="responsive-card text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {users.filter(u => u.role === 'OWNER').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Owners</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="responsive-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
            <h2 className="responsive-heading-3 text-gradient">All Users</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-white">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-medium text-white">User</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Employee ID</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-white">{user.name || 'Unnamed'}</div>
                          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'OWNER' ? 'bg-purple-900 text-purple-300' :
                          user.role === 'MANAGER' ? 'bg-blue-900 text-blue-300' :
                          user.role === 'ACCOUNTANT' ? 'bg-green-900 text-green-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className="text-sm text-white capitalize">{user.status}</span>
                          {user.mustChangePassword && (
                            <span className="text-xs text-orange-400">(Reset Required)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-white">
                          {user.employeeProfile?.adpWorkerId || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View
                          </button>
                          {canResetPasswords && (
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-orange-400 hover:text-orange-300 text-sm"
                            >
                              Reset Password
                            </button>
                          )}
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="responsive-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="responsive-heading-2 text-gradient">Create New User</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400"
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Role *</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-medium text-white mb-4">Employee Information (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">ADP Worker ID</label>
                      <input
                        type="text"
                        value={newUserForm.employeeData.adpWorkerId}
                        onChange={(e) => setNewUserForm(prev => ({
                          ...prev,
                          employeeData: { ...prev.employeeData, adpWorkerId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400"
                        placeholder="EMP001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Manager ID</label>
                      <select
                        value={newUserForm.employeeData.managerId}
                        onChange={(e) => setNewUserForm(prev => ({
                          ...prev,
                          employeeData: { ...prev.employeeData, managerId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                      >
                        <option value="">Select Manager</option>
                        {users.filter(u => u.role === 'MANAGER' || u.role === 'OWNER').map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} ({manager.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="generatePassword"
                      checked={newUserForm.generatePassword}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, generatePassword: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-black/30 border-white/20 rounded"
                    />
                    <label htmlFor="generatePassword" className="text-sm text-white">
                      Generate temporary password (recommended)
                    </label>
                  </div>

                  {!newUserForm.generatePassword && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Password *</label>
                      <input
                        type="password"
                        required={!newUserForm.generatePassword}
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400"
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 touch-button border border-current text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 touch-button bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent text-center"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="responsive-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="responsive-heading-2 text-gradient">User Details</h2>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <div className="text-white">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name</label>
                    <div className="text-white">{selectedUser.name || 'Not set'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Role</label>
                    <div className="text-white">{selectedUser.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status</label>
                    <div className="text-white capitalize">{selectedUser.status}</div>
                  </div>
                </div>

                {selectedUser.employeeProfile && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-medium text-white mb-4">Employee Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>ADP Worker ID</label>
                        <div className="text-white">{selectedUser.employeeProfile.adpWorkerId || 'Not set'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manager ID</label>
                        <div className="text-white">{selectedUser.employeeProfile.managerId || 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.rbacUserRoles.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-medium text-white mb-4">RBAC Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.rbacUserRoles.map((userRole, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm"
                        >
                          {userRole.role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Created</label>
                      <div className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Last Updated</label>
                      <div className="text-white">{new Date(selectedUser.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="w-full touch-button border border-current text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}