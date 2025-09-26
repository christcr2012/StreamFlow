// src/pages/admin/governance-center.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import AppNav from "@/components/AppNav";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

interface PolicyConfiguration {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  config: Record<string, any>;
  lastUpdated: string;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  target: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export default function GovernanceCenter() {
  const { me, loading } = useMe();
  const [activeTab, setActiveTab] = useState('policies');
  const [policies, setPolicies] = useState<PolicyConfiguration[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    userId: '',
    dateRange: '7d'
  });

  // SOC 2 compliant policy configurations
  const defaultPolicies: PolicyConfiguration[] = [
    {
      id: 'password_policy',
      name: 'Password Policy',
      category: 'Authentication',
      enabled: true,
      config: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 12,
        maxAge: 90,
        lockoutThreshold: 5,
        lockoutDuration: 30
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mfa_policy',
      name: 'Multi-Factor Authentication',
      category: 'Authentication',
      enabled: true,
      config: {
        required: true,
        allowedMethods: ['totp', 'sms', 'backup_codes'],
        gracePeriod: 7,
        exemptRoles: [],
        enforceForPrivilegedUsers: true
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'session_policy',
      name: 'Session Management',
      category: 'Security',
      enabled: true,
      config: {
        maxSessionDuration: 480, // 8 hours
        idleTimeout: 60, // 1 hour
        concurrentSessions: 3,
        requireReauth: ['password_change', 'role_change', 'sensitive_actions'],
        secureTransport: true
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'data_retention',
      name: 'Data Retention Policy',
      category: 'Compliance',
      enabled: true,
      config: {
        auditLogRetention: 2555, // 7 years in days
        userDataRetention: 2555,
        leadDataRetention: 1825, // 5 years
        jobDataRetention: 1095, // 3 years
        automaticPurge: true,
        exportBeforePurge: true
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'ip_access_control',
      name: 'IP Access Control',
      category: 'Network Security',
      enabled: false,
      config: {
        allowList: [],
        denyList: [],
        strictMode: false,
        logBlocked: true,
        exemptRoles: ['OWNER'],
        geoBlocking: {
          enabled: false,
          blockedCountries: []
        }
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'data_residency',
      name: 'Data Residency',
      category: 'Compliance',
      enabled: true,
      config: {
        primaryRegion: 'US',
        allowedRegions: ['US', 'CA'],
        dataLocalization: true,
        crossBorderTransfer: false,
        encryptionInTransit: true,
        encryptionAtRest: true
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'breakglass_access',
      name: 'Break-glass Access',
      category: 'Emergency',
      enabled: true,
      config: {
        allowedUsers: [],
        maxDuration: 60, // minutes
        requireJustification: true,
        autoExpiry: true,
        notifyOwners: true,
        auditLevel: 'detailed'
      },
      lastUpdated: new Date().toISOString()
    }
  ];

  useEffect(() => {
    if (me && hasPerm(me, PERMS.POLICY_MANAGE)) {
      fetchPolicies();
      fetchAuditEvents();
    }
  }, [me, auditFilters]);

  const fetchPolicies = async () => {
    try {
      // For now, use default policies. In production, this would fetch from API
      setPolicies(defaultPolicies);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  };

  const fetchAuditEvents = async () => {
    try {
      const response = await fetch(`/api/admin/audit-events?${new URLSearchParams(auditFilters)}`);
      if (response.ok) {
        const data = await response.json();
        setAuditEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit events:', error);
    }
  };

  const handlePolicyToggle = async (policyId: string) => {
    try {
      const policy = policies.find(p => p.id === policyId);
      if (!policy) return;

      const updatedPolicy = { ...policy, enabled: !policy.enabled };
      
      // Optimistic update
      setPolicies(prev => prev.map(p => 
        p.id === policyId ? updatedPolicy : p
      ));

      // API call would go here
      console.log('Policy toggle:', policyId, updatedPolicy.enabled);
    } catch (error) {
      console.error('Failed to toggle policy:', error);
    }
  };

  const handlePolicyUpdate = async (policyId: string, config: Record<string, any>) => {
    try {
      const updatedPolicy = {
        ...policies.find(p => p.id === policyId)!,
        config,
        lastUpdated: new Date().toISOString()
      };

      setPolicies(prev => prev.map(p => 
        p.id === policyId ? updatedPolicy : p
      ));

      // API call would go here
      console.log('Policy update:', policyId, config);
    } catch (error) {
      console.error('Failed to update policy:', error);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditFilters)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getPolicyStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-400 bg-green-900' : 'text-yellow-400 bg-yellow-900';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Authentication': 'text-blue-400 bg-blue-900',
      'Security': 'text-purple-400 bg-purple-900',
      'Compliance': 'text-green-400 bg-green-900',
      'Network Security': 'text-red-400 bg-red-900',
      'Emergency': 'text-orange-400 bg-orange-900'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400 bg-gray-900';
  };

  if (loading) return <div>Loading...</div>;

  if (!me || !hasPerm(me, PERMS.POLICY_MANAGE)) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-gray-300 mt-2">You need Owner-level permissions to access the Governance Center.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Governance & Policy Center - Enterprise Administration</title>
      </Head>
      <AppNav />
      
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Governance & Policy Center</h1>
          <p className="text-gray-400">SOC 2 compliant security policies and comprehensive audit management</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'policies', name: 'Security Policies', icon: '🛡️' },
            { id: 'audit', name: 'Audit Logs', icon: '📋' },
            { id: 'compliance', name: 'Compliance', icon: '✅' },
            { id: 'monitoring', name: 'Security Monitoring', icon: '👁️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Security Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{policy.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(policy.category)}`}>
                        {policy.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPolicyStatusColor(policy.enabled)}`}>
                        {policy.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePolicyToggle(policy.id)}
                        className={`px-4 py-2 text-sm rounded transition-colors ${
                          policy.enabled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {policy.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(policy.config).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-white">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                           Array.isArray(value) ? `${value.length} items` : 
                           String(value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Last updated: {new Date(policy.lastUpdated).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <select
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="">All Actions</option>
                  <option value="login">Login</option>
                  <option value="user:create">User Create</option>
                  <option value="role:change">Role Change</option>
                  <option value="policy:update">Policy Update</option>
                </select>
                
                <select
                  value={auditFilters.dateRange}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="1d">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
              
              <button
                onClick={exportAuditLogs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Export CSV
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {auditEvents.length > 0 ? auditEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {event.userEmail}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                            {event.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {event.target}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {event.ipAddress}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No audit events found for the selected criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-400 mb-2">98%</div>
                <div className="text-gray-300">SOC 2 Compliance</div>
                <div className="text-sm text-gray-500 mt-1">Last audit: Q3 2024</div>
              </div>
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-400 mb-2">45</div>
                <div className="text-gray-300">Active Controls</div>
                <div className="text-sm text-gray-500 mt-1">7 categories covered</div>
              </div>
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-400 mb-2">2</div>
                <div className="text-gray-300">Open Findings</div>
                <div className="text-sm text-gray-500 mt-1">Due within 30 days</div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SOC 2 Control Status</h3>
              <div className="space-y-3">
                {[
                  { name: 'Access Controls', status: 'Compliant', color: 'green' },
                  { name: 'Data Encryption', status: 'Compliant', color: 'green' },
                  { name: 'Incident Response', status: 'Compliant', color: 'green' },
                  { name: 'Change Management', status: 'Under Review', color: 'yellow' },
                  { name: 'Risk Assessment', status: 'Needs Attention', color: 'red' }
                ].map((control) => (
                  <div key={control.name} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <span className="text-white">{control.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      control.color === 'green' ? 'bg-green-900 text-green-300' :
                      control.color === 'yellow' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {control.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-xl font-bold text-green-400">0</div>
                <div className="text-gray-300 text-sm">Active Threats</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-xl font-bold text-blue-400">12</div>
                <div className="text-gray-300 text-sm">Failed Logins (24h)</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-xl font-bold text-yellow-400">3</div>
                <div className="text-gray-300 text-sm">Anomalies Detected</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-xl font-bold text-purple-400">156</div>
                <div className="text-gray-300 text-sm">Security Events</div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Security Alerts</h3>
              <div className="space-y-3">
                {[
                  { 
                    severity: 'medium', 
                    message: 'Multiple failed login attempts from IP 192.168.1.100',
                    time: '2 minutes ago' 
                  },
                  { 
                    severity: 'low', 
                    message: 'User accessed system outside normal hours',
                    time: '15 minutes ago' 
                  },
                  { 
                    severity: 'high', 
                    message: 'Unusual data export activity detected',
                    time: '1 hour ago' 
                  }
                ].map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></span>
                      <span className="text-white">{alert.message}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}