'use client';

import { useState, useEffect } from 'react';

type RotationPolicy = {
  id: string;
  name: string;
  keyType: 'federation' | 'api' | 'encryption';
  rotationIntervalDays: number;
  gracePeriodDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
  enabled: boolean;
  lastRotation: string | null;
  nextRotation: string | null;
};

type RotationHistory = {
  id: string;
  keyType: string;
  rotatedAt: string;
  rotatedBy: string;
  reason: string;
  oldKeyId: string;
  newKeyId: string;
};

export default function SecretsRotationPage() {
  const [policies, setPolicies] = useState<RotationPolicy[]>([]);
  const [history, setHistory] = useState<RotationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create/Edit policy state
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RotationPolicy | null>(null);
  const [policyName, setPolicyName] = useState('');
  const [keyType, setKeyType] = useState<'federation' | 'api' | 'encryption'>('federation');
  const [rotationIntervalDays, setRotationIntervalDays] = useState(90);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [autoRotate, setAutoRotate] = useState(false);
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(14);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    
    try {
      const [policiesRes, historyRes] = await Promise.all([
        fetch('/api/provider/secrets-rotation/policies'),
        fetch('/api/provider/secrets-rotation/history'),
      ]);
      
      const policiesData = await policiesRes.json();
      const historyData = await historyRes.json();
      
      setPolicies(policiesData.policies || []);
      setHistory(historyData.history || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function savePolicy() {
    setError('');
    setSuccess('');
    
    if (!policyName) {
      setError('Policy name is required');
      return;
    }
    
    try {
      const method = editingPolicy ? 'PUT' : 'POST';
      const url = editingPolicy 
        ? `/api/provider/secrets-rotation/policies/${editingPolicy.id}`
        : '/api/provider/secrets-rotation/policies';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: policyName,
          keyType,
          rotationIntervalDays,
          gracePeriodDays,
          autoRotate,
          notifyBeforeDays,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save policy');
      }
      
      setSuccess(editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deletePolicy(id: string) {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/provider/secrets-rotation/policies/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete policy');
      }
      
      setSuccess('Policy deleted successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function togglePolicy(id: string, enabled: boolean) {
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/provider/secrets-rotation/policies/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to toggle policy');
      }
      
      setSuccess(`Policy ${enabled ? 'enabled' : 'disabled'} successfully`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function rotateNow(policyId: string) {
    if (!confirm('Are you sure you want to rotate keys now? This will invalidate old keys after the grace period.')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/provider/secrets-rotation/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rotate keys');
      }
      
      const data = await res.json();
      setSuccess(`Keys rotated successfully. New key ID: ${data.newKeyId}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function editPolicy(policy: RotationPolicy) {
    setEditingPolicy(policy);
    setPolicyName(policy.name);
    setKeyType(policy.keyType);
    setRotationIntervalDays(policy.rotationIntervalDays);
    setGracePeriodDays(policy.gracePeriodDays);
    setAutoRotate(policy.autoRotate);
    setNotifyBeforeDays(policy.notifyBeforeDays);
    setShowPolicyForm(true);
  }

  function resetForm() {
    setShowPolicyForm(false);
    setEditingPolicy(null);
    setPolicyName('');
    setKeyType('federation');
    setRotationIntervalDays(90);
    setGracePeriodDays(7);
    setAutoRotate(false);
    setNotifyBeforeDays(14);
  }

  function getDaysUntilRotation(nextRotation: string | null): number | null {
    if (!nextRotation) return null;
    const days = Math.ceil((new Date(nextRotation).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Secrets Rotation Automation</h1>
        <p className="text-gray-600 mb-8">
          Automate key rotation with configurable policies and grace periods.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Policies Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Rotation Policies</h2>
                <button
                  onClick={() => setShowPolicyForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Policy
                </button>
              </div>

              {showPolicyForm && (
                <div className="mb-6 p-6 bg-white border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Policy Name</label>
                      <input
                        type="text"
                        value={policyName}
                        onChange={(e) => setPolicyName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="e.g., Federation Keys - Quarterly Rotation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Key Type</label>
                      <select
                        value={keyType}
                        onChange={(e) => setKeyType(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="federation">Federation Keys</option>
                        <option value="api">API Keys</option>
                        <option value="encryption">Encryption Keys</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Rotation Interval (days)</label>
                        <input
                          type="number"
                          value={rotationIntervalDays}
                          onChange={(e) => setRotationIntervalDays(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Grace Period (days)</label>
                        <input
                          type="number"
                          value={gracePeriodDays}
                          onChange={(e) => setGracePeriodDays(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Notify Before (days)</label>
                      <input
                        type="number"
                        value={notifyBeforeDays}
                        onChange={(e) => setNotifyBeforeDays(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={autoRotate}
                          onChange={(e) => setAutoRotate(e.target.checked)}
                        />
                        <span className="text-sm font-medium">Enable Automatic Rotation</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        When enabled, keys will be rotated automatically based on the interval
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={savePolicy}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {editingPolicy ? 'Update' : 'Create'}
                      </button>
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {policies.map((policy) => {
                  const daysUntil = getDaysUntilRotation(policy.nextRotation);
                  const isUrgent = daysUntil !== null && daysUntil <= policy.notifyBeforeDays;
                  
                  return (
                    <div key={policy.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-gray-600">
                            Type: {policy.keyType} | Interval: {policy.rotationIntervalDays} days | 
                            Grace: {policy.gracePeriodDays} days
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePolicy(policy.id, !policy.enabled)}
                            className={`px-3 py-1 text-sm rounded ${
                              policy.enabled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {policy.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => editPolicy(policy)}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePolicy(policy.id)}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Last Rotation</p>
                          <p className="font-medium">
                            {policy.lastRotation 
                              ? new Date(policy.lastRotation).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Next Rotation</p>
                          <p className={`font-medium ${isUrgent ? 'text-orange-600' : ''}`}>
                            {policy.nextRotation 
                              ? `${new Date(policy.nextRotation).toLocaleDateString()} (${daysUntil} days)`
                              : 'Not scheduled'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Auto-Rotate</p>
                          <p className="font-medium">{policy.autoRotate ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {policy.enabled && (
                        <div className="mt-3">
                          <button
                            onClick={() => rotateNow(policy.id)}
                            className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                          >
                            Rotate Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {policies.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No rotation policies configured. Create one to get started.
                  </div>
                )}
              </div>
            </div>

            {/* History Section */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Rotation History</h2>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Old Key</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">New Key</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rotated By</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">
                          {new Date(item.rotatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">{item.keyType}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{item.oldKeyId}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{item.newKeyId}</td>
                        <td className="px-4 py-3 text-sm">{item.rotatedBy}</td>
                        <td className="px-4 py-3 text-sm">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No rotation history yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

