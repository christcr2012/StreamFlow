// src/pages/admin/role-builder.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import AppNav from "@/components/AppNav";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

interface Permission {
  id: string;
  code: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  isSystem: boolean;
}

interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  industry: string;
  permissions: string[];
}

export default function RoleBuilder() {
  const { me, loading } = useMe();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [presets, setPresets] = useState<PermissionPreset[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  // Industry-specific permission presets matching enterprise standards
  const industryPresets: PermissionPreset[] = [
    {
      id: "cleaning_manager",
      name: "Cleaning Operations Manager",
      description: "Full operational control for cleaning service managers",
      industry: "Cleaning Services",
      permissions: [
        PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_CREATE,
        PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT,
        PERMS.JOB_READ, PERMS.JOB_CREATE, PERMS.JOB_UPDATE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE, PERMS.JOB_COMPLETE,
        PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_SCHEDULE, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
        PERMS.CLIENT_READ, PERMS.CLIENT_UPDATE, PERMS.CLIENT_COMMUNICATE,
        PERMS.SCHEDULE_READ, PERMS.SCHEDULE_MANAGE, PERMS.INVENTORY_READ, PERMS.INVENTORY_MANAGE
      ]
    },
    {
      id: "finance_controller",
      name: "Finance Controller",
      description: "Complete financial management and reporting access",
      industry: "Financial Management", 
      permissions: [
        PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT,
        PERMS.BILLING_READ, PERMS.BILLING_MANAGE, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.INVOICE_DELETE,
        PERMS.PAYMENT_READ, PERMS.PAYMENT_PROCESS, PERMS.REVENUE_READ, PERMS.REVENUE_MANAGE,
        PERMS.PAYROLL_READ, PERMS.PAYROLL_MANAGE, PERMS.AUDIT_READ,
        PERMS.CLIENT_READ, PERMS.CLIENT_COMMUNICATE
      ]
    },
    {
      id: "hr_specialist",
      name: "HR Specialist",
      description: "Human resources and employee lifecycle management",
      industry: "Human Resources",
      permissions: [
        PERMS.DASHBOARD_VIEW, PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_CREATE, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_DELETE,
        PERMS.HR_READ, PERMS.HR_MANAGE, PERMS.HR_HIRE, PERMS.HR_TERMINATE,
        PERMS.TRAINING_READ, PERMS.TRAINING_MANAGE, PERMS.TRAINING_ASSIGN,
        PERMS.PAYROLL_READ, PERMS.TIMECLOCK_READ, PERMS.USER_CREATE, PERMS.PASSWORD_RESET
      ]
    },
    {
      id: "operations_supervisor",
      name: "Operations Supervisor", 
      description: "Day-to-day operations and team coordination",
      industry: "Operations",
      permissions: [
        PERMS.DASHBOARD_VIEW, PERMS.JOB_READ, PERMS.JOB_UPDATE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE,
        PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_SCHEDULE, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
        PERMS.CLIENT_READ, PERMS.CLIENT_COMMUNICATE, PERMS.SCHEDULE_READ, PERMS.SCHEDULE_MANAGE,
        PERMS.OPERATIONS_READ, PERMS.OPERATIONS_MANAGE, PERMS.INVENTORY_READ
      ]
    },
    {
      id: "sales_lead",
      name: "Sales Lead",
      description: "Lead generation, conversion, and client relationship management",
      industry: "Sales & Marketing",
      permissions: [
        PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ,
        PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT, PERMS.LEAD_EXPORT,
        PERMS.CLIENT_READ, PERMS.CLIENT_CREATE, PERMS.CLIENT_UPDATE, PERMS.CLIENT_COMMUNICATE,
        PERMS.BILLING_READ, PERMS.INVOICE_READ, PERMS.REVENUE_READ
      ]
    }
  ];

  // Permission categories for organization
  const permissionCategories = {
    "Dashboard & Analytics": [
      PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT
    ],
    "Lead Management": [
      PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT
    ],
    "Job Management": [
      PERMS.JOB_READ, PERMS.JOB_CREATE, PERMS.JOB_UPDATE, PERMS.JOB_DELETE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE, PERMS.JOB_COMPLETE
    ],
    "Workforce Management": [
      PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_CREATE, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_DELETE, PERMS.EMPLOYEE_SCHEDULE,
      PERMS.PAYROLL_READ, PERMS.PAYROLL_MANAGE, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE
    ],
    "HR Management": [
      PERMS.HR_READ, PERMS.HR_MANAGE, PERMS.HR_HIRE, PERMS.HR_TERMINATE, PERMS.TRAINING_READ, PERMS.TRAINING_MANAGE, PERMS.TRAINING_ASSIGN
    ],
    "Financial Management": [
      PERMS.BILLING_READ, PERMS.BILLING_MANAGE, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.INVOICE_DELETE,
      PERMS.PAYMENT_READ, PERMS.PAYMENT_PROCESS, PERMS.REVENUE_READ, PERMS.REVENUE_MANAGE
    ],
    "System Administration": [
      PERMS.USER_READ, PERMS.USER_CREATE, PERMS.USER_UPDATE, PERMS.USER_DELETE, PERMS.PASSWORD_RESET,
      PERMS.ROLES_READ, PERMS.ROLES_MANAGE, PERMS.SYSTEM_SETTINGS, PERMS.AUDIT_READ
    ],
    "Enterprise Controls": [
      PERMS.ROLE_CREATE, PERMS.PERMISSION_GRANT, PERMS.POLICY_MANAGE, PERMS.TENANT_CONFIGURE, PERMS.FEATURE_TOGGLE
    ]
  };

  useEffect(() => {
    if (me && hasPerm(me, PERMS.ROLE_CREATE)) {
      fetchRoles();
    }
  }, [me]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleCreateRole = () => {
    setIsEditing(true);
    setSelectedRole(null);
    setRoleForm({ name: "", description: "", permissions: [] });
  };

  const handleEditRole = (role: Role) => {
    setIsEditing(true);
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
  };

  const handleApplyPreset = (preset: PermissionPreset) => {
    setRoleForm(prev => ({
      ...prev,
      name: prev.name || preset.name,
      description: prev.description || preset.description,
      permissions: [...new Set([...prev.permissions, ...preset.permissions])]
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSaveRole = async () => {
    try {
      const method = selectedRole ? 'PUT' : 'POST';
      const url = selectedRole ? `/api/admin/roles/${selectedRole.id}` : '/api/admin/roles';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        setIsEditing(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        console.error('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!me || !hasPerm(me, PERMS.ROLE_CREATE)) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-gray-300 mt-2">You need Owner-level permissions to access the Role Builder.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Custom Role Builder - Enterprise Administration</title>
      </Head>
      <AppNav />
      
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Custom Role Builder</h1>
          <p className="text-gray-400">Create and manage custom roles with granular permissions</p>
        </header>

        <div className="grid grid-cols-4 gap-6">
          {/* Roles Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Roles</h2>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                + New Role
              </button>
            </div>
            
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleEditRole(role)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    role.isSystem 
                      ? 'bg-gray-800 border-gray-600 text-gray-400' 
                      : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{role.permissions.length} permissions</div>
                  {role.isSystem && (
                    <div className="text-xs text-yellow-400 mt-1">System Role</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {isEditing ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {selectedRole ? 'Edit Role' : 'Create New Role'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRole}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Save Role
                    </button>
                  </div>
                </div>

                {/* Role Details Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Role Name</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
                      placeholder="Enter role name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white h-20"
                      placeholder="Describe this role's responsibilities"
                    />
                  </div>
                </div>

                {/* Industry Presets */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Industry Templates</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {industryPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className="p-3 text-left bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{preset.description}</div>
                        <div className="text-xs text-blue-400 mt-1">{preset.permissions.length} permissions</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permission Categories */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Permissions ({roleForm.permissions.length} selected)
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(permissionCategories).map(([category, perms]) => (
                      <div key={category} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <h4 className="font-medium mb-3">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((permission) => (
                            <label
                              key={permission}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={roleForm.permissions.includes(permission)}
                                onChange={() => handlePermissionToggle(permission)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                              />
                              <span className="text-sm">{permission.split(':')[1] || permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Role Management</h2>
                <p className="text-gray-400 mb-6">
                  Create custom roles with granular permissions tailored to your organization's needs.
                  Use industry templates for quick setup or build completely custom roles.
                </p>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Getting Started</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Click "New Role" to create a custom role</li>
                      <li>• Use industry templates for quick setup</li>
                      <li>• Assign granular permissions by category</li>
                      <li>• Test roles with your team members</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Best Practices</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Follow principle of least privilege</li>
                      <li>• Regularly review and audit permissions</li>
                      <li>• Use descriptive role names and descriptions</li>
                      <li>• Test roles before deploying to users</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}