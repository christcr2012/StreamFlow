'use client';

/**
 * Fleet Dashboard - Main View
 * Binder6: Frontend UI for Binder3 Fleet Management
 * 
 * Features:
 * - Vehicle list with filters
 * - Quick action buttons
 * - Status indicators
 * - Maintenance ticket overview
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Vehicle {
  id: string;
  assetTag: string | null;
  vin: string | null;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string;
  odometer: string;
  buId: string | null;
}

interface MaintenanceTicket {
  id: string;
  vehicleId: string;
  title: string;
  severity: string | null;
  status: string;
  openedAt: string;
}

export default function FleetDashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buFilter, setBuFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [statusFilter, buFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles
      const vehicleParams = new URLSearchParams();
      if (statusFilter !== 'all') vehicleParams.append('status', statusFilter);
      if (buFilter !== 'all') vehicleParams.append('buId', buFilter);
      
      const vehicleRes = await fetch(`/api/tenant/fleet/vehicles?${vehicleParams}`);
      if (!vehicleRes.ok) throw new Error('Failed to fetch vehicles');
      const vehicleData = await vehicleRes.json();
      setVehicles(vehicleData.result || []);
      
      // Fetch maintenance tickets
      const ticketRes = await fetch('/api/tenant/fleet/maintenance_tickets?limit=10');
      if (!ticketRes.ok) throw new Error('Failed to fetch tickets');
      const ticketData = await ticketRes.json();
      setTickets(ticketData.result || []);
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage vehicles, maintenance, and operations</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/fleet/vehicles/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + Add Vehicle
        </button>
        <button
          onClick={() => router.push('/fleet/maintenance/new')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + Create Ticket
        </button>
        <button
          onClick={() => router.push('/fleet/dvir')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          DVIR Reports
        </button>
        <button
          onClick={() => router.push('/fleet/fuel')}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Fuel Logs
        </button>
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
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <select
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Locations</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Vehicles</p>
          <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600">
            {vehicles.filter(v => v.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">In Maintenance</p>
          <p className="text-3xl font-bold text-yellow-600">
            {vehicles.filter(v => v.status === 'maintenance').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Open Tickets</p>
          <p className="text-3xl font-bold text-red-600">
            {tickets.filter(t => t.status === 'open').length}
          </p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Vehicles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{vehicle.assetTag || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{vehicle.plate || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{vehicle.odometer}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => router.push(`/fleet/vehicles/${vehicle.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Maintenance Tickets */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Maintenance Tickets</h2>
        </div>
        <div className="p-6">
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No maintenance tickets</p>
          ) : (
            <div className="space-y-4">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Opened {new Date(ticket.openedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(ticket.severity)}`}>
                        {ticket.severity || 'normal'}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

