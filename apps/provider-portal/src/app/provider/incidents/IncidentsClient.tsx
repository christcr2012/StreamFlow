'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, CheckCircle, Clock, XCircle, Filter, Download, Bell, Zap, Calendar, Search } from 'lucide-react';
import FederationEscalationsSection from './FederationEscalationsSection';

type Incident = {
  id: string;
  orgId: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'OPEN' | 'ACK' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  title: string;
  description: string;
  assigneeUserId: string | null;
  slaResponseDeadline: string | null;
  slaResolveDeadline: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  org: { id: string; name: string };
};

export default function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'federation'>('incidents');

  // Enhanced filtering state
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Bulk operations state
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Integration hooks state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchIncidents in useCallback
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (dateRangeStart) params.set('startDate', dateRangeStart);
      if (dateRangeEnd) params.set('endDate', dateRangeEnd);

      const res = await fetch(`/api/provider/incidents?${params}`);
      const data = await res.json();

      if (data.ok) {
        setIncidents(data.data.incidents);
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, severityFilter, dateRangeStart, dateRangeEnd]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Filter incidents based on search and tenant filter
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchQuery === '' ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTenant = tenantFilter === '' ||
      incident.org.name.toLowerCase().includes(tenantFilter.toLowerCase());

    return matchesSearch && matchesTenant;
  });

  // Bulk operations handlers
  const toggleSelectAll = () => {
    if (selectedIncidents.size === filteredIncidents.length) {
      setSelectedIncidents(new Set());
    } else {
      setSelectedIncidents(new Set(filteredIncidents.map(i => i.id)));
    }
  };

  const toggleSelectIncident = (id: string) => {
    const newSelected = new Set(selectedIncidents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIncidents(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch('/api/provider/incidents/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentIds: Array.from(selectedIncidents),
          status: newStatus,
        }),
      });

      if (res.ok) {
        setSelectedIncidents(new Set());
        fetchIncidents();
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Severity', 'Status', 'Title', 'Organization', 'Created', 'SLA Response', 'SLA Resolve'];
    const rows = filteredIncidents.map(i => [
      i.id,
      i.severity,
      i.status,
      i.title,
      i.org.name,
      new Date(i.createdAt).toISOString(),
      i.slaResponseDeadline || 'N/A',
      i.slaResolveDeadline || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4" style={{ color: 'var(--accent-warning)' }} />;
      case 'ACK': return <Clock className="h-4 w-4" style={{ color: 'var(--accent-info)' }} />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />;
      case 'CLOSED': return <XCircle className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P1': return 'var(--accent-error)';
      case 'P2': return 'var(--accent-warning)';
      case 'P3': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  const stats = {
    open: incidents.filter(i => i.status === 'OPEN').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ACK').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    closed: incidents.filter(i => i.status === 'CLOSED').length,
    slaBreached: incidents.filter(i => {
      if (!i.slaResponseDeadline) return false;
      return new Date(i.slaResponseDeadline) < new Date() && !i.acknowledgedAt;
    }).length,
    p1Count: incidents.filter(i => i.severity === 'P1').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Incidents & Escalations
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track customer incidents and federation escalations with SLA monitoring and automated workflows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <Zap className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => setShowIntegrationModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <Bell className="h-4 w-4" />
            Integrations
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--brand-gradient)',
              color: 'white',
            }}
          >
            <Plus className="h-4 w-4" />
            New Incident
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setActiveTab('incidents')}
          className="px-4 py-2 font-medium transition-all"
          style={{
            color: activeTab === 'incidents' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'incidents' ? '2px solid var(--brand-primary)' : '2px solid transparent',
          }}
        >
          Customer Incidents
        </button>
        <button
          onClick={() => setActiveTab('federation')}
          className="px-4 py-2 font-medium transition-all"
          style={{
            color: activeTab === 'federation' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'federation' ? '2px solid var(--brand-primary)' : '2px solid transparent',
          }}
        >
          Federation Escalations
        </button>
      </div>

      {activeTab === 'incidents' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Open</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-warning)' }}>{stats.open}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>In Progress</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>{stats.inProgress}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Resolved</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-success)' }}>{stats.resolved}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Closed</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-muted)' }}>{stats.closed}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>SLA Breached</div>
          <div className="text-2xl font-bold mt-1" style={{ color: stats.slaBreached > 0 ? 'var(--accent-error)' : 'var(--accent-success)' }}>{stats.slaBreached}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>P1 Critical</div>
          <div className="text-2xl font-bold mt-1" style={{ color: stats.p1Count > 0 ? 'var(--accent-error)' : 'var(--text-muted)' }}>{stats.p1Count}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search incidents by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: showAdvancedFilters ? 'var(--surface-3)' : 'var(--surface-1)',
              color: 'var(--text-primary)',
              border: `1px solid ${showAdvancedFilters ? 'var(--border-accent)' : 'var(--border-primary)'}`,
            }}
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          {selectedIncidents.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: 'var(--brand-gradient)',
                color: 'white',
              }}
            >
              Bulk Actions ({selectedIncidents.size})
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Tenant
                </label>
                <input
                  type="text"
                  placeholder="Filter by tenant..."
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex gap-2">
          {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f ? 'var(--surface-3)' : 'var(--surface-1)',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--border-accent)' : 'var(--border-primary)'}`,
              }}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedIncidents.size > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-accent)' }}>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedIncidents.size} incident(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('ACK')}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('IN_PROGRESS')}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('RESOLVED')}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                >
                  Resolve
                </button>
                <button
                  onClick={() => setShowEscalationModal(true)}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ background: 'var(--accent-warning)', color: 'white' }}
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incidents List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            No incidents found. {searchQuery || tenantFilter ? 'Try adjusting your filters.' : 'Create your first incident to get started.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-primary)' }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIncidents.size === filteredIncidents.length}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Severity</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Title</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Organization</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>SLA</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => {
                const slaBreached = incident.slaResponseDeadline &&
                  new Date(incident.slaResponseDeadline) < new Date() &&
                  !incident.acknowledgedAt;

                return (
                  <tr
                    key={incident.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIncidents.has(incident.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectIncident(incident.id);
                        }}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ background: `${getSeverityColor(incident.severity)}20`, color: getSeverityColor(incident.severity) }}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td className="p-4 cursor-pointer" onClick={() => setSelectedIncident(incident.id)}>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{incident.title}</div>
                      <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {incident.description.substring(0, 60)}...
                      </div>
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{incident.org.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(incident.status)}
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {slaBreached ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-error)' }}>
                          <AlertCircle className="h-3 w-3" />
                          Breached
                        </span>
                      ) : incident.slaResponseDeadline ? (
                        <span className="text-xs" style={{ color: 'var(--accent-success)' }}>
                          On Track
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Create Incident</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Incident creation form will be implemented here.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg"
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetailsModal
          incidentId={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onRefresh={fetchIncidents}
        />
      )}

      {/* Integration Hooks Modal */}
      {showIntegrationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowIntegrationModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-2xl w-full m-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Integration Hooks</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Configure integrations to automatically notify your team when incidents are created or updated.
            </p>

            <div className="space-y-4">
              <div className="rounded-lg p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Slack</span>
                  </div>
                  <button className="px-3 py-1 rounded text-sm font-medium" style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                    Connect
                  </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Send incident notifications to Slack channels
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-error)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>PagerDuty</span>
                  </div>
                  <button className="px-3 py-1 rounded text-sm font-medium" style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                    Connect
                  </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Create PagerDuty incidents for P1/P2 severity issues
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Webhook</span>
                  </div>
                  <button className="px-3 py-1 rounded text-sm font-medium" style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                    Configure
                  </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Send incident data to custom webhook endpoints
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIntegrationModal(false)}
              className="mt-6 w-full px-4 py-2 rounded-lg font-medium"
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Incident Templates Modal */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-2xl w-full m-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Incident Templates</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Use pre-configured templates to quickly create common incident types.
            </p>

            <div className="space-y-3">
              {[
                { name: 'Service Outage', severity: 'P1', description: 'Complete service unavailability' },
                { name: 'Performance Degradation', severity: 'P2', description: 'Slow response times or timeouts' },
                { name: 'Feature Bug', severity: 'P3', description: 'Non-critical feature malfunction' },
                { name: 'Security Incident', severity: 'P1', description: 'Potential security breach or vulnerability' },
                { name: 'Data Issue', severity: 'P2', description: 'Data inconsistency or corruption' },
              ].map((template) => (
                <div
                  key={template.name}
                  className="rounded-lg p-4 cursor-pointer transition-all"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onClick={() => {
                    setShowTemplateModal(false);
                    setShowCreateModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{template.name}</div>
                      <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{template.description}</div>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        background: template.severity === 'P1' ? 'rgba(239, 68, 68, 0.2)' : template.severity === 'P2' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: template.severity === 'P1' ? '#ef4444' : template.severity === 'P2' ? '#f59e0b' : '#3b82f6',
                      }}
                    >
                      {template.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowTemplateModal(false)}
              className="mt-6 w-full px-4 py-2 rounded-lg font-medium"
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowEscalationModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full m-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Escalate Incidents</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Escalate {selectedIncidents.size} selected incident(s) to higher priority or management.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Escalation Reason
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg"
                  rows={3}
                  placeholder="Describe why this incident needs escalation..."
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Escalate To
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option>Engineering Manager</option>
                  <option>VP of Engineering</option>
                  <option>CTO</option>
                  <option>On-Call Engineer</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEscalationModal(false);
                    setSelectedIncidents(new Set());
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--accent-warning)', color: 'white' }}
                >
                  Escalate
                </button>
                <button
                  onClick={() => setShowEscalationModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <FederationEscalationsSection />
      )}
    </div>
  );
}

// Incident Details Modal Component
function IncidentDetailsModal({ incidentId, onClose, onRefresh }: { incidentId: string; onClose: () => void; onRefresh: () => void }) {
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'P3',
    status: 'OPEN',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchIncidentDetails in useCallback
  const fetchIncidentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/provider/incidents/${incidentId}`);
      const data = await res.json();

      if (data.ok) {
        setIncident(data.data.incident);
        setFormData({
          title: data.data.incident.title,
          description: data.data.incident.description,
          severity: data.data.incident.severity,
          status: data.data.incident.status,
        });
      }
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchIncidentDetails();
  }, [fetchIncidentDetails]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/provider/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditing(false);
        fetchIncidentDetails();
        onRefresh();
      } else {
        alert('Failed to update incident');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Error updating incident');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/provider/incidents/${incidentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert('Failed to delete incident');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Error deleting incident');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="rounded-xl p-8 max-w-2xl w-full mx-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}>
          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-2xl font-bold px-3 py-1 rounded w-full"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            ) : (
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{incident.title}</h2>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>ID: {incident.id}</p>
          </div>
          <button onClick={onClose} className="text-2xl font-bold hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>

        {/* Edit/Save Buttons */}
        {editing ? (
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded font-medium"
              style={{ background: 'var(--brand-primary)', color: 'white' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormData({
                  title: incident.title,
                  description: incident.description,
                  severity: incident.severity,
                  status: incident.status,
                });
              }}
              className="px-4 py-2 rounded font-medium"
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded font-medium mb-6"
            style={{ background: 'var(--brand-primary)', color: 'white' }}
          >
            Edit Incident
          </button>
        )}

        {/* Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            ) : (
              <p style={{ color: 'var(--text-primary)' }}>{incident.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Severity</label>
              {editing ? (
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 rounded"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                </select>
              ) : (
                <p style={{ color: 'var(--text-primary)' }}>{incident.severity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
              {editing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="OPEN">Open</option>
                  <option value="ACK">Acknowledged</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <p style={{ color: 'var(--text-primary)' }}>{incident.status}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Organization</label>
              <p style={{ color: 'var(--text-primary)' }}>{incident.org.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Created</label>
              <p style={{ color: 'var(--text-primary)' }}>{new Date(incident.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--accent-error)' }}>Danger Zone</h3>
          {showDeleteConfirm ? (
            <div className="rounded-lg p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-error)' }}>
              <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
                Are you sure you want to delete this incident? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--accent-error)', color: 'white' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Incident'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded font-medium"
              style={{ background: 'var(--accent-error)', color: 'white' }}
            >
              Delete Incident
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

