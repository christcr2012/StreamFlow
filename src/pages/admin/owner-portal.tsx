// src/pages/admin/owner-portal.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import AppNav from "@/components/AppNav";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

interface OwnerCapabilitySection {
  id: string;
  title: string;
  description: string;
  capabilities: Array<{
    name: string;
    description: string;
    permission: string;
    status: 'enabled' | 'disabled' | 'configured' | 'pending';
    action?: () => void;
  }>;
}

export default function OwnerPortal() {
  const { me, loading } = useMe();
  const [activeSection, setActiveSection] = useState('business_ops');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeFeatures: 0,
    integrations: 0,
    auditEvents: 0
  });

  // Enterprise-grade Owner capability sections matching industry standards
  const sections: OwnerCapabilitySection[] = [
    {
      id: 'business_ops',
      title: 'Business Operations',
      description: 'Full CRUD control over business data and workflow configuration',
      capabilities: [
        {
          name: 'Customer Management',
          description: 'Full CRUD on customers, leads, and opportunities',
          permission: PERMS.CLIENT_CREATE,
          status: 'enabled'
        },
        {
          name: 'Employee Management', 
          description: 'Complete workforce and HR management',
          permission: PERMS.EMPLOYEE_CREATE,
          status: 'enabled'
        },
        {
          name: 'Service Configuration',
          description: 'Configure service offerings and pricing models',
          permission: PERMS.SYSTEM_SETTINGS,
          status: 'configured'
        },
        {
          name: 'Workflow Templates',
          description: 'Industry templates and custom workflow configuration',
          permission: PERMS.WORKFLOW_CONFIGURE,
          status: 'configured'
        },
        {
          name: 'Asset Management',
          description: 'Equipment, vehicles, and resource tracking',
          permission: PERMS.INVENTORY_MANAGE,
          status: 'enabled'
        }
      ]
    },
    {
      id: 'user_role_admin',
      title: 'User & Role Administration',
      description: 'Advanced user lifecycle and custom role builder',
      capabilities: [
        {
          name: 'Custom Role Builder',
          description: 'Create custom roles with granular permissions',
          permission: PERMS.ROLE_CREATE,
          status: 'enabled'
        },
        {
          name: 'Permission Presets',
          description: 'Industry-specific permission templates',
          permission: PERMS.PERMISSION_PRESET_MANAGE,
          status: 'configured'
        },
        {
          name: 'Department Scoping',
          description: 'Location and department-based access controls',
          permission: PERMS.DEPARTMENT_SCOPE,
          status: 'enabled'
        },
        {
          name: 'Approval Workflows',
          description: 'Multi-step approval for elevated access',
          permission: PERMS.APPROVAL_WORKFLOW_MANAGE,
          status: 'configured'
        },
        {
          name: 'Magic Link Invites',
          description: 'Secure user invitation system',
          permission: PERMS.USER_INVITE_MAGIC,
          status: 'enabled'
        }
      ]
    },
    {
      id: 'feature_controls',
      title: 'Provider Feature Controls',
      description: 'Module toggles, AI features, and cost management',
      capabilities: [
        {
          name: 'Feature Toggles',
          description: 'Enable/disable platform modules and features',
          permission: PERMS.FEATURE_TOGGLE,
          status: 'enabled'
        },
        {
          name: 'AI Feature Controls',
          description: 'Configure AI-powered features and limits',
          permission: PERMS.AI_FEATURE_CONTROL,
          status: 'configured'
        },
        {
          name: 'Usage Dashboard',
          description: 'Monitor feature usage and performance',
          permission: PERMS.USAGE_DASHBOARD,
          status: 'enabled'
        },
        {
          name: 'Cost Management',
          description: 'Budget guardrails and cost monitoring',
          permission: PERMS.COST_DASHBOARD,
          status: 'configured'
        },
        {
          name: 'Resource Limits',
          description: 'Set tenant limits and quotas',
          permission: PERMS.TENANT_LIMITS,
          status: 'enabled'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations Management',
      description: 'SSO, accounting, webhooks, and API management',
      capabilities: [
        {
          name: 'SSO Configuration',
          description: 'SAML/OIDC single sign-on setup',
          permission: PERMS.SSO_MANAGE,
          status: 'pending'
        },
        {
          name: 'SCIM Provisioning',
          description: 'Automated user provisioning and sync',
          permission: PERMS.SCIM_MANAGE,
          status: 'pending'
        },
        {
          name: 'Accounting Integration',
          description: 'QuickBooks, Xero, and other accounting systems',
          permission: PERMS.INTEGRATION_CONFIGURE,
          status: 'configured'
        },
        {
          name: 'Webhook Management',
          description: 'Configure webhooks for external systems',
          permission: PERMS.WEBHOOK_MANAGE,
          status: 'enabled'
        },
        {
          name: 'OAuth Apps',
          description: 'Manage OAuth applications and API keys',
          permission: PERMS.OAUTH_APP_MANAGE,
          status: 'configured'
        }
      ]
    },
    {
      id: 'governance',
      title: 'Governance & Security',
      description: 'Policies, audit logs, and compliance controls',
      capabilities: [
        {
          name: 'Policy Center',
          description: 'Password, MFA, and session policies',
          permission: PERMS.POLICY_MANAGE,
          status: 'configured'
        },
        {
          name: 'Audit Log Access',
          description: 'Complete audit trail with export capabilities',
          permission: PERMS.AUDIT_EXPORT,
          status: 'enabled'
        },
        {
          name: 'IP Access Controls',
          description: 'Allow/deny lists for network access',
          permission: PERMS.IP_ALLOWLIST_MANAGE,
          status: 'configured'
        },
        {
          name: 'Data Retention',
          description: 'Configure data retention and residency policies',
          permission: PERMS.DATA_RETENTION_POLICY,
          status: 'configured'
        },
        {
          name: 'Break-glass Access',
          description: 'Just-in-time elevation with auto-expiry',
          permission: PERMS.BREAKGLASS_ACCESS,
          status: 'enabled'
        }
      ]
    },
    {
      id: 'support',
      title: 'Support & Impersonation',
      description: 'Secure support sessions and provider assistance',
      capabilities: [
        {
          name: 'Support Sessions',
          description: 'Initiate secure support with consent banner',
          permission: PERMS.SUPPORT_SESSION_INITIATE,
          status: 'enabled'
        },
        {
          name: 'User Impersonation',
          description: 'Secure impersonation with immutable audit trail',
          permission: PERMS.USER_IMPERSONATE_SECURE,
          status: 'enabled'
        },
        {
          name: 'Consent Management',
          description: 'Manage support consent and permissions',
          permission: PERMS.SUPPORT_CONSENT_MANAGE,
          status: 'configured'
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Audit & Compliance',
      description: 'SOC 2 controls and enterprise compliance',
      capabilities: [
        {
          name: 'SOC 2 Controls',
          description: 'RBAC, MFA, logging aligned to SOC 2',
          permission: PERMS.SOC2_CONTROLS,
          status: 'configured'
        },
        {
          name: 'Compliance Audit',
          description: 'Generate compliance reports and evidence',
          permission: PERMS.COMPLIANCE_AUDIT,
          status: 'enabled'
        },
        {
          name: 'Data Residency',
          description: 'Configure data location and residency',
          permission: PERMS.DATA_RESIDENCY_CONFIGURE,
          status: 'configured'
        },
        {
          name: 'Security Monitoring',
          description: 'Advanced threat detection and monitoring',
          permission: PERMS.SECURITY_MONITORING,
          status: 'enabled'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'text-green-600 bg-green-100';
      case 'configured': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'disabled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    // Fetch owner dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/owner-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch owner stats:', error);
      }
    };

    if (me && hasPerm(me, PERMS.TENANT_CONFIGURE)) {
      fetchStats();
    }
  }, [me]);

  if (loading) return <div>Loading...</div>;

  if (!me || !hasPerm(me, PERMS.TENANT_CONFIGURE)) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-gray-300 mt-2">You need Owner-level permissions to access this portal.</p>
      </div>
    );
  }

  const activeData = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Owner Portal - Enterprise Administration</title>
      </Head>
      <AppNav />
      
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Owner Portal</h1>
          <p className="text-gray-400">Enterprise-grade tenant administration and control</p>
          
          {/* Owner Dashboard Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-gray-400 text-sm">Total Users</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.activeFeatures}</div>
              <div className="text-gray-400 text-sm">Active Features</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.integrations}</div>
              <div className="text-gray-400 text-sm">Integrations</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.auditEvents}</div>
              <div className="text-gray-400 text-sm">Audit Events</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{section.title}</div>
                <div className="text-sm opacity-75 mt-1">{section.description}</div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            <div className="bg-gray-900 border border-gray-700 rounded-lg">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">{activeData.title}</h2>
                <p className="text-gray-400 mt-2">{activeData.description}</p>
              </div>
              <div className="p-6 space-y-4">
                {activeData.capabilities.map((capability, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{capability.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(capability.status)}`}>
                            {capability.status}
                          </span>
                          {hasPerm(me, capability.permission as any) ? (
                            <span className="text-green-400 text-xs">✓ Authorized</span>
                          ) : (
                            <span className="text-red-400 text-xs">⚠ No Access</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{capability.description}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {hasPerm(me, capability.permission as any) && (
                          <>
                            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                              Configure
                            </button>
                            {capability.status === 'enabled' && (
                              <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                                Manage
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}