'use client';
import { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle2, Users } from 'lucide-react';

export function TimeTrackingClient({ orgId }: { orgId: string }) {
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/time-tracking').then(r => r.json()).then(d => {
      setTimeEntries(d.timeEntries || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  const activeEntry = timeEntries.find(e => e.status === 'active');
  const totalHours = timeEntries.filter(e => e.status !== 'active').reduce((s, e) => s + e.totalHours, 0);
  const totalPay = timeEntries.filter(e => e.status === 'approved').reduce((s, e) => s + e.totalPay, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking & Payroll</h1>
          <p className="text-gray-600 mt-1">Track time and manage payroll</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Hours</p><p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p></div><Clock className="w-10 h-10 text-blue-600" /></div></div>
          <div className="bg-white rounded-lg border p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Pay</p><p className="text-2xl font-bold text-gray-900">${totalPay.toFixed(2)}</p></div><CheckCircle2 className="w-10 h-10 text-green-600" /></div></div>
          <div className="bg-white rounded-lg border p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active Sessions</p><p className="text-2xl font-bold text-gray-900">{activeEntry ? 1 : 0}</p></div><Users className="w-10 h-10 text-purple-600" /></div></div>
        </div>

        {activeEntry && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold text-blue-900">Active Time Entry</h3><p className="text-blue-700">{activeEntry.jobTitle}</p><p className="text-sm text-blue-600">Clocked in at {new Date(activeEntry.clockIn).toLocaleTimeString()}</p></div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Square className="w-4 h-4" />Clock Out</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-900">Time Entries</h3></div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.userName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(entry.clockIn).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.clockOut ? new Date(entry.clockOut).toLocaleString() : 'Active'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{entry.totalHours.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${entry.totalPay.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${entry.status === 'approved' ? 'bg-green-100 text-green-800' : entry.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{entry.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium mb-1">Phase 1: Stub Implementation</p><p>Time tracking with stub data. Phase 2: Real clock in/out, GPS verification, payroll calculations.</p></div></div></div>
      </div>
    </div>
  );
}
