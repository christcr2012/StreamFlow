'use client';

/**
 * DVIR Reports Page
 * Binder6: Frontend UI for Geotab DVIR Integration
 * 
 * Features:
 * - DVIR log list with defect highlighting
 * - Auto-create maintenance tickets from DVIR
 * - Compliance status dashboard
 * - Date range filters
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DVIRLog {
  id: string;
  deviceId: string | null;
  driverId: string | null;
  vehicleRef: string | null;
  defects: any;
  certifiedAt: string | null;
  status: string;
  createdAt: string;
}

export default function DVIRReportsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<DVIRLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Note: This endpoint doesn't exist yet in Binder3, would need to be added
      // For now, we'll show a placeholder
      setLogs([]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      const res = await fetch('/api/tenant/integrations/geotab/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType: 'dvir',
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      
      if (!res.ok) throw new Error('Sync failed');
      
      const data = await res.json();
      alert(`Synced ${data.synced || 0} DVIR logs, created ${data.ticketsCreated || 0} tickets`);
      
      fetchLogs();
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTicket = async (log: DVIRLog) => {
    if (!log.vehicleRef) {
      alert('No vehicle reference found for this DVIR log');
      return;
    }
    
    try {
      const res = await fetch('/api/tenant/fleet/maintenance_tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: log.vehicleRef,
          title: `DVIR Defect - ${log.deviceId}`,
          description: `Auto-created from DVIR log ${log.id}`,
          severity: 'high',
          dvirRef: log.id,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create ticket');
      
      alert('Maintenance ticket created successfully');
      fetchLogs();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DVIR logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DVIR Reports</h1>
            <p className="mt-2 text-gray-600">Driver Vehicle Inspection Reports from Geotab</p>
          </div>
          <button
            onClick={() => router.push('/fleet')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Fleet
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Sync Controls */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync from Geotab</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync DVIR Logs'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="processed">Processed</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total DVIR Logs</p>
          <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">New</p>
          <p className="text-3xl font-bold text-blue-600">
            {logs.filter(l => l.status === 'new').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Processed</p>
          <p className="text-3xl font-bold text-green-600">
            {logs.filter(l => l.status === 'processed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">With Defects</p>
          <p className="text-3xl font-bold text-red-600">
            {logs.filter(l => l.defects && Array.isArray(l.defects) && l.defects.length > 0).length}
          </p>
        </div>
      </div>

      {/* DVIR Log List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">DVIR Logs</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No DVIR logs found</p>
            <p className="text-sm text-gray-400">Click "Sync DVIR Logs" to import from Geotab</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Defects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{log.deviceId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.driverId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.certifiedAt ? new Date(log.certifiedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.defects && Array.isArray(log.defects) ? log.defects.length : 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.status === 'new' && log.vehicleRef && (
                        <button
                          onClick={() => handleCreateTicket(log)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Create Ticket
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

