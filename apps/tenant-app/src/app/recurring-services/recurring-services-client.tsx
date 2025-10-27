'use client';
import { useState, useEffect } from 'react';
import { Repeat, Calendar, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export function RecurringServicesClient({ orgId }: { orgId: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recurring-services').then(r => r.json()).then(d => {
      setServices(d.recurringServices || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  const activeServices = services.filter(s => s.status === 'active');
  const totalRevenue = services.reduce((s, srv) => s + (srv.price * srv.completedServices), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><h1 className="text-3xl font-bold text-gray-900">Recurring Services</h1><p className="text-gray-600 mt-1">Manage maintenance contracts and subscriptions</p></div></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Active Contracts</p><p className="text-2xl font-bold text-gray-900">{activeServices.length}</p></div>
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p></div>
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Completed Services</p><p className="text-2xl font-bold text-gray-900">{services.reduce((s, srv) => s + srv.completedServices, 0)}</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.serviceName}</h3>
                  <p className="text-sm text-gray-600">{service.customerName}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{service.status}</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Frequency:</span><span className="font-medium text-gray-900 capitalize">{service.frequency}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Price:</span><span className="font-medium text-gray-900">${service.price}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Next Service:</span><span className="font-medium text-gray-900">{new Date(service.nextServiceDate).toLocaleDateString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Progress:</span><span className="font-medium text-gray-900">{service.completedServices}/{service.totalServices}</span></div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {service.autoRenew && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Auto-Renew</span>}
                  <span>Started {new Date(service.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><Repeat className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium mb-1">Phase 1: Stub Implementation</p><p>Recurring services with stub data. Phase 2: Auto job creation, renewal workflows, customer subscriptions.</p></div></div></div>
      </div>
    </div>
  );
}
