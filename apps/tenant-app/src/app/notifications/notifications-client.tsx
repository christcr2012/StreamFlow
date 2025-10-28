'use client';
import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Briefcase, Users, Settings as SettingsIcon } from 'lucide-react';

export function NotificationsClient({ orgId }: { orgId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => {
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
      setLoading(false);
    });
  }, []);

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => prev - 1);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'customer': return Users;
      case 'system': return SettingsIcon;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><h1 className="text-3xl font-bold text-gray-900">Notifications</h1><p className="text-gray-600 mt-1">{unreadCount} unread notifications</p></div></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center"><Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="text-gray-500">No notifications</p></div>
          ) : (
            notifications.map(notif => {
              const Icon = getIcon(notif.type);
              return (
                <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${notif.type === 'job' ? 'bg-blue-100 text-blue-600' : notif.type === 'customer' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(notif.priority)}`}>{notif.priority}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                          <p className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        {!notif.read && (
                          <button onClick={() => markAsRead(notif.id)} className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium mb-1">Phase 1: Stub Implementation</p><p>Notifications with stub data. Phase 2: Real-time WebSocket updates, email/SMS delivery, preference management.</p></div></div></div>
      </div>
    </div>
  );
}
