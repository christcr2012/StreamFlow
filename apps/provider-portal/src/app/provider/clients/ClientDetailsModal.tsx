import { useState, useEffect, useCallback } from 'react';

interface ClientDetailsModalProps {
  clientId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ClientDetailsModal({ clientId, onClose, onRefresh }: ClientDetailsModalProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchClientDetails in useCallback
  const fetchClientDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setEditName(data.name);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/provider/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setEditing(false);
        fetchClientDetails();
        onRefresh();
      }
    } catch (error) {
      console.error('Error saving client:', error);
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
      const res = await fetch(`/api/provider/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold px-3 py-1 rounded"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(client.name);
                  }}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>ID: {client.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>

        {/* Organization Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Status</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{client.status}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Created</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {new Date(client.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Owner */}
        {client.owner && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Owner</h3>
            <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
              <div style={{ color: 'var(--text-primary)' }}>{client.owner.name}</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{client.owner.email}</div>
            </div>
          </div>
        )}

        {/* Subscription */}
        {client.subscription && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Subscription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Plan</div>
                <div style={{ color: 'var(--text-primary)' }}>{client.subscription.plan}</div>
              </div>
              <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Price</div>
                <div style={{ color: 'var(--text-primary)' }}>{client.subscription.price}</div>
              </div>
              <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Status</div>
                <div style={{ color: 'var(--text-primary)' }}>{client.subscription.status}</div>
              </div>
              <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Next Billing</div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {client.subscription.nextBillingDate ? new Date(client.subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Usage (Last 30 Days)</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg p-4 text-center" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{client.usage.activeUsers30d}</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Active Users</div>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{client.usage.apiCalls30d}</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>API Calls</div>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{client.usage.storageUsedMB}</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Storage (MB)</div>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{client.usage.aiCreditsUsed}</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>AI Credits</div>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Users ({client.users.length})</h3>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th className="px-4 py-2 text-left text-sm" style={{ color: 'var(--text-tertiary)' }}>Name</th>
                  <th className="px-4 py-2 text-left text-sm" style={{ color: 'var(--text-tertiary)' }}>Email</th>
                  <th className="px-4 py-2 text-left text-sm" style={{ color: 'var(--text-tertiary)' }}>Role</th>
                  <th className="px-4 py-2 text-left text-sm" style={{ color: 'var(--text-tertiary)' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {client.users.map((user: any) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{user.name}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{user.role}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Billing</h3>
          <div className="rounded-lg p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Revenue</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              ${client.billing.totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--accent-error)' }}>Danger Zone</h3>
          {showDeleteConfirm ? (
            <div className="rounded-lg p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-error)' }}>
              <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--accent-error)', color: 'white' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Client'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
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
              Delete Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

