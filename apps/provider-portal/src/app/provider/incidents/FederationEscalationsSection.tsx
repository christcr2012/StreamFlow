'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Clock, GitBranch, Rocket, RotateCcw, Filter } from 'lucide-react';

type EscalationTicket = {
  id: string;
  escalationId: string;
  tenantId: string;
  orgId: string;
  type: string;
  severity: string;
  description: string;
  state: string;
  createdAt: string;
};

export default function FederationEscalationsSection() {
  const [escalations, setEscalations] = useState<EscalationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchEscalations in useCallback
  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateFilter !== 'all') params.set('state', stateFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);

      const res = await fetch(`/api/federation/escalations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEscalations(data.escalations || []);
      }
    } catch (error) {
      console.error('Error fetching federation escalations:', error);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, severityFilter]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const handleStateTransition = async (id: string, newState: string) => {
    try {
      const res = await fetch(`/api/federation/escalations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });

      if (res.ok) {
        fetchEscalations();
      }
    } catch (error) {
      console.error('Error updating escalation state:', error);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'received': return <Clock className="h-4 w-4" style={{ color: 'var(--accent-info)' }} />;
      case 'sandbox_created': return <GitBranch className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />;
      case 'pr_opened': return <GitBranch className="h-4 w-4" style={{ color: 'var(--accent-warning)' }} />;
      case 'canary_requested': return <Rocket className="h-4 w-4" style={{ color: 'var(--accent-warning)' }} />;
      case 'rolled_out': return <CheckCircle className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />;
      case 'rolled_back': return <RotateCcw className="h-4 w-4" style={{ color: 'var(--accent-error)' }} />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'var(--accent-error)';
      case 'high': return 'var(--accent-warning)';
      case 'medium': return 'var(--accent-info)';
      case 'low': return 'var(--text-muted)';
      default: return 'var(--text-secondary)';
    }
  };

  const getNextActions = (state: string) => {
    switch (state) {
      case 'received': return [{ label: 'Create Sandbox', nextState: 'sandbox_created' }];
      case 'sandbox_created': return [{ label: 'Open PR', nextState: 'pr_opened' }];
      case 'pr_opened': return [{ label: 'Request Canary', nextState: 'canary_requested' }];
      case 'canary_requested': return [
        { label: 'Roll Out', nextState: 'rolled_out' },
        { label: 'Roll Back', nextState: 'rolled_back' }
      ];
      default: return [];
    }
  };

  const stats = {
    total: escalations.length,
    received: escalations.filter(e => e.state === 'received').length,
    inProgress: escalations.filter(e => ['sandbox_created', 'pr_opened', 'canary_requested'].includes(e.state)).length,
    completed: escalations.filter(e => e.state === 'rolled_out').length,
    rolledBack: escalations.filter(e => e.state === 'rolled_back').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Federation Escalations
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track escalations received via federation API with automated deployment workflows
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Received</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-info)' }}>{stats.received}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>In Progress</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>{stats.inProgress}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-success)' }}>{stats.completed}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rolled Back</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-error)' }}>{stats.rolledBack}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <Filter className="inline h-4 w-4 mr-1" />
            State
          </label>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All States</option>
            <option value="received">Received</option>
            <option value="sandbox_created">Sandbox Created</option>
            <option value="pr_opened">PR Opened</option>
            <option value="canary_requested">Canary Requested</option>
            <option value="rolled_out">Rolled Out</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Severity
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Escalations List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading escalations...</div>
        ) : escalations.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            No federation escalations found. {stateFilter !== 'all' || severityFilter !== 'all' ? 'Try adjusting your filters.' : 'Escalations will appear here when received via the federation API.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-primary)' }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Escalation ID</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Severity</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Source</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>State</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Created</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {escalations.map((escalation) => (
                <tr
                  key={escalation.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="p-4">
                    <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {escalation.escalationId}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {escalation.description.substring(0, 40)}...
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{escalation.type}</td>
                  <td className="p-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ background: `${getSeverityColor(escalation.severity)}20`, color: getSeverityColor(escalation.severity) }}
                    >
                      {escalation.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Tenant: {escalation.tenantId}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Org: {escalation.orgId}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStateIcon(escalation.state)}
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {escalation.state.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(escalation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {getNextActions(escalation.state).map((action) => (
                        <button
                          key={action.nextState}
                          onClick={() => handleStateTransition(escalation.id, action.nextState)}
                          className="px-3 py-1 rounded text-xs font-medium transition-all"
                          style={{
                            background: action.nextState === 'rolled_back' ? 'var(--accent-error)' : 'var(--brand-primary)',
                            color: 'white',
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

