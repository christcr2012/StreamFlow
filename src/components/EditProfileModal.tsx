// src/components/EditProfileModal.tsx
import { useState, useEffect } from "react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onProfileUpdated: (newName: string) => void;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  currentName,
  onProfileUpdated 
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setMsg(null);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setMsg('Profile updated successfully!');
      onProfileUpdated(name.trim());
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setMsg(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-2xl max-w-md w-full mx-4"
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <h2 className="text-xl font-bold text-gradient">✏️ Edit Profile</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Update your profile information
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
            style={{ background: 'var(--surface-2)' }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Display Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                maxLength={100}
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                How your name appears to other users
              </p>
            </div>

            {msg && (
              <div 
                className="px-3 py-2 rounded-lg text-sm"
                style={msg.includes('successfully') || msg.includes('updated') 
                  ? { background: 'rgba(34, 197, 94, 0.2)', color: 'rgb(34, 197, 94)' }
                  : { background: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)' }
                }
              >
                {msg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={busy}
            >
              {busy ? '🔄 Updating...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}