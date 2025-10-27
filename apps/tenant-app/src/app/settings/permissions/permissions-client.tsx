'use client';
import { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle, Lock } from 'lucide-react';

export function PermissionsClient({ orgId }: { orgId: string }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  useEffect(() => {
    Promise.all([
      fetch('/api/permissions').then(r => r.json()),
      fetch('/api/permissions?type=users').then(r => r.json())
    ]).then(([rolesData, usersData]) => {
      setRoles(rolesData.roles || []);
      setUsers(usersData.users || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1><p className="text-gray-600 mt-1">Manage user access and permissions</p></div></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b"><nav className="flex"><button onClick={() => setActiveTab('roles')} className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Roles</button><button onClick={() => setActiveTab('users')} className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>User Assignments</button></nav></div>

          {activeTab === 'roles' && (
            <div className="p-6">
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          {role.isSystem && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded">System</span>}
                        </div>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{role.userCount}</p>
                        <p className="text-xs text-gray-500">users</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-2">PERMISSIONS ({role.permissions.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm: string) => (
                          <span key={perm} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{perm}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <table className="min-w-full">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="font-medium text-gray-900">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div></td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">{user.roleName}</span></td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.lastLogin).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium mb-1">Phase 1: Stub Implementation</p><p>RBAC system with stub data. Phase 2: Full permission enforcement, role builder, audit logging.</p></div></div></div>
      </div>
    </div>
  );
}
