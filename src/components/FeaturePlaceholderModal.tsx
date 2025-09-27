// src/components/FeaturePlaceholderModal.tsx
import { useState } from 'react';

interface FeaturePlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: {
    name: string;
    icon: string;
    description: string;
    capabilities: string[];
    timeline: string;
  };
}

export default function FeaturePlaceholderModal({ isOpen, onClose, feature }: FeaturePlaceholderModalProps) {
  const [notifyMeChecked, setNotifyMeChecked] = useState(false);

  const handleNotifyMe = async () => {
    if (notifyMeChecked) {
      // Here we could implement actual notification signup
      // For now, just show a success message
      alert(`✅ You'll be notified when ${feature.name} is available!`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-2xl p-6" 
           style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {feature.icon} {feature.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-xl"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        </div>

        {/* Feature Preview */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl text-center" 
               style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="text-4xl mb-2">🚀</div>
            <h3 className="font-medium mb-2">Coming Soon</h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {feature.description}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Planned Features:</h4>
            <ul className="space-y-2">
              {feature.capabilities.map((capability, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {capability}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg" 
               style={{ background: 'var(--surface-success)', border: '1px solid var(--border-success)' }}>
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <span>📅</span>
              <span className="font-medium text-sm">Expected Timeline</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-success)' }}>
              {feature.timeline}
            </p>
          </div>

          {/* Notification Signup */}
          <div className="p-4 rounded-lg" 
               style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notify-me"
                checked={notifyMeChecked}
                onChange={(e) => setNotifyMeChecked(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--brand-primary)' }}
              />
              <label htmlFor="notify-me" className="text-sm cursor-pointer">
                Notify me when this feature is available
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button 
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
            >
              Close
            </button>
            {notifyMeChecked && (
              <button 
                onClick={handleNotifyMe}
                className="flex-1 py-2 px-4 rounded-lg"
                style={{ background: 'var(--brand-primary)', color: 'white' }}
              >
                📢 Notify Me
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}