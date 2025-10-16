'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ActionItem {
  id: string;
  type: 'approval' | 'alert' | 'task' | 'review';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  orgName?: string;
  createdAt: string;
  dueDate?: string;
  actionUrl?: string;
}

export default function ActionCenterPage() {
  const router = useRouter();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approval' | 'alert' | 'task' | 'review'>('all');

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/actions');
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionId: string, actionType: 'approve' | 'reject' | 'complete') => {
    try {
      const response = await fetch(`/api/provider/actions/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      });

      if (response.ok) {
        // Refresh actions
        fetchActions();
      }
    } catch (error) {
      console.error('Error handling action:', error);
    }
  };

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.type === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return 'var(--text-secondary)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval': return '✓';
      case 'alert': return '⚠️';
      case 'task': return '📋';
      case 'review': return '👁️';
      default: return '•';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading action center...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Action Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Critical actions requiring your attention
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'approval', 'alert', 'task', 'review'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: filter === f ? 'var(--brand-primary)' : 'var(--glass-bg)',
                color: filter === f ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--brand-primary)' : 'var(--border-primary)'}`
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {actions.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Actions</div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}>
          <div className="text-2xl font-bold" style={{ color: '#ff4444' }}>
            {actions.filter(a => a.priority === 'high').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>High Priority</div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {actions.filter(a => a.type === 'approval').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending Approvals</div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {actions.filter(a => a.type === 'alert').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Alerts</div>
        </div>
      </div>

      {/* Actions List */}
      {filteredActions.length === 0 ? (
        <div className="p-12 text-center rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            All Caught Up!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            No pending actions at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className="p-4 rounded-lg"
              style={{
                background: 'var(--glass-bg)',
                border: `1px solid ${getPriorityColor(action.priority)}`,
                borderLeft: `4px solid ${getPriorityColor(action.priority)}`
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(action.type)}</span>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {action.title}
                      </h3>
                      {action.orgName && (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {action.orgName}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {action.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Created: {new Date(action.createdAt).toLocaleDateString()}</span>
                    {action.dueDate && (
                      <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                    )}
                    <span
                      className="px-2 py-1 rounded"
                      style={{
                        background: getPriorityColor(action.priority) + '20',
                        color: getPriorityColor(action.priority)
                      }}
                    >
                      {action.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {action.type === 'approval' && (
                    <>
                      <button
                        onClick={() => handleAction(action.id, 'approve')}
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ background: '#00ff88', color: '#000' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(action.id, 'reject')}
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ background: '#ff4444', color: '#fff' }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {action.type === 'task' && (
                    <button
                      onClick={() => handleAction(action.id, 'complete')}
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
                    >
                      Complete
                    </button>
                  )}
                  {action.actionUrl && (
                    <button
                      onClick={() => router.push(action.actionUrl!)}
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

