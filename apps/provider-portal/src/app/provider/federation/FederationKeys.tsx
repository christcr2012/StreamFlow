import { useState, useEffect } from 'react';

export default function FederationKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/federation/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      // Get orgId from session or default
      const orgId = 'org_default'; // TODO: Get from session/context

      const res = await fetch('/api/federation/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, name: newKeyName })
      });

      if (res.ok) {
        const data = await res.json();
        // Show one-time secret reveal modal
        setNewSecret(data.key.secret);
        setShowSecretModal(true);
        setNewKeyName('');
        setShowCreate(false);
        fetchKeys();
      }
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseSecretModal = () => {
    setShowSecretModal(false);
    setNewSecret(null);
  };

  const handleCopySecret = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      setCopiedKey(newSecret);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key?')) return;
    
    try {
      const res = await fetch(`/api/federation/keys/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Error revoking key:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Federation Keys</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded font-medium"
          style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
        >
          Generate New Key
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Generate New Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 rounded font-medium"
                style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
              >
                {creating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName('');
                }}
                className="px-4 py-2 rounded font-medium"
                style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>No federation keys yet. Generate one to get started.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th className="px-4 py-3 text-left" style={{ color: 'var(--text-primary)' }}>Name</th>
                <th className="px-4 py-3 text-left" style={{ color: 'var(--text-primary)' }}>Key</th>
                <th className="px-4 py-3 text-left" style={{ color: 'var(--text-primary)' }}>Created</th>
                <th className="px-4 py-3 text-left" style={{ color: 'var(--text-primary)' }}>Last Used</th>
                <th className="px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {key.key.substring(0, 20)}...
                    </code>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleCopy(key.key)}
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
                      >
                        {copiedKey === key.key ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' }}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* One-time secret reveal modal */}
      {showSecretModal && newSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w-2xl w-full mx-4" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              ⚠️ Save Your API Secret
            </h3>
            <div className="space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                This is the only time you&apos;ll see this secret. Copy it now and store it securely.
              </p>
              <div className="rounded p-4 font-mono text-sm break-all" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                {newSecret}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopySecret}
                  className="flex-1 px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
                >
                  {copiedKey === newSecret ? '✓ Copied!' : 'Copy Secret'}
                </button>
                <button
                  onClick={handleCloseSecretModal}
                  className="px-4 py-2 rounded font-medium"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  I&apos;ve Saved It
                </button>
              </div>
              <p className="text-sm" style={{ color: 'var(--error-text)' }}>
                Warning: Once you close this dialog, you won&apos;t be able to retrieve this secret again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

