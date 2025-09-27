// src/components/TwoFactorModal.tsx
import { useState, useEffect } from 'react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTwoFactorUpdated: () => void;
}

interface TwoFactorStatus {
  isEnabled: boolean;
  phoneNumber: string | null;
  verifiedAt: string | null;
  hasBackupCodes: boolean;
}

interface SetupData {
  secret: string;
  otpauth: string;
  backupCodes: string[];
  qrCodeUrl: string;
}

export default function TwoFactorModal({ isOpen, onClose, onTwoFactorUpdated }: TwoFactorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup_codes'>('status');

  // Load 2FA status when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTwoFactorStatus();
    }
  }, [isOpen]);

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/two-factor');
      const result = await response.json();
      
      if (result.ok) {
        setTwoFactorStatus(result.twoFactor);
      } else {
        setError(result.error || 'Failed to load 2FA status');
      }
    } catch (error) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/two-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' })
      });
      
      const result = await response.json();
      if (result.ok) {
        setSetupData(result.setup);
        setStep('setup');
      } else {
        setError(result.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!totpCode) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/two-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'enable',
          totpCode,
          phoneNumber: phoneNumber || null
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        setSuccess('Two-factor authentication enabled successfully!');
        setStep('backup_codes');
        onTwoFactorUpdated();
        loadTwoFactorStatus();
      } else {
        setError(result.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      setError('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/two-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' })
      });
      
      const result = await response.json();
      if (result.ok) {
        setSuccess('Two-factor authentication disabled');
        onTwoFactorUpdated();
        loadTwoFactorStatus();
        setStep('status');
      } else {
        setError(result.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('status');
    setSetupData(null);
    setTotpCode('');
    setPhoneNumber('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const codesText = setupData.backupCodes.join('\\n');
    const blob = new Blob([`WorkStream Two-Factor Authentication Backup Codes\\n\\nSave these codes in a safe place. Each code can only be used once.\\n\\n${codesText}`], 
      { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workstream-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-2xl p-6" 
           style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            📱 Two-Factor Authentication
          </h2>
          <button 
            onClick={handleClose}
            className="text-xl"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--surface-error)', color: 'var(--text-error)' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--surface-success)', color: 'var(--text-success)' }}>
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
          </div>
        ) : (
          <>
            {step === 'status' && (
              <div className="space-y-4">
                {twoFactorStatus?.isEnabled ? (
                  <>
                    <div className="p-4 rounded-lg" style={{ background: 'var(--surface-success)' }}>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <span>✅</span>
                        <span className="font-medium">Two-Factor Authentication Enabled</span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {twoFactorStatus.phoneNumber && <p>Phone: {twoFactorStatus.phoneNumber}</p>}
                        <p>Enabled: {twoFactorStatus.verifiedAt ? new Date(twoFactorStatus.verifiedAt).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleDisable2FA}
                      className="w-full py-2 px-4 rounded-lg border"
                      style={{ 
                        borderColor: 'var(--text-error)',
                        color: 'var(--text-error)',
                        background: 'transparent'
                      }}
                    >
                      Disable Two-Factor Authentication
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔒</div>
                        <h3 className="font-medium mb-2">Secure Your Account</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          Two-factor authentication adds an extra layer of security to your account.
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleSetup2FA}
                      className="w-full py-2 px-4 rounded-lg"
                      style={{ background: 'var(--brand-primary)', color: 'white' }}
                    >
                      Enable Two-Factor Authentication
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 'setup' && setupData && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Scan QR Code</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code:
                  </p>
                  <div className="mb-4">
                    <img 
                      src={setupData.qrCodeUrl} 
                      alt="2FA QR Code" 
                      className="mx-auto rounded-lg"
                      style={{ background: 'white', padding: '8px' }}
                    />
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Manual entry key: <code className="p-1 rounded" style={{ background: 'var(--surface-2)' }}>{setupData.secret}</code>
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number (Optional - for SMS backup)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full p-2 rounded-lg border"
                      style={{ 
                        background: 'var(--surface-2)', 
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setStep('verify')}
                  className="w-full py-2 px-4 rounded-lg"
                  style={{ background: 'var(--brand-primary)', color: 'white' }}
                >
                  Next: Verify Code
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Enter Verification Code</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Enter the 6-digit code from your authenticator app:
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full p-3 text-center text-lg font-mono rounded-lg border"
                    style={{ 
                      background: 'var(--surface-2)', 
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                      letterSpacing: '0.2em'
                    }}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setStep('setup')}
                    className="flex-1 py-2 px-4 rounded-lg border"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleEnable2FA}
                    className="flex-1 py-2 px-4 rounded-lg"
                    style={{ background: 'var(--brand-primary)', color: 'white' }}
                    disabled={totpCode.length !== 6}
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {step === 'backup_codes' && setupData && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-medium mb-2">2FA Enabled Successfully!</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Save these backup codes in a secure place. Each can only be used once.
                  </p>
                </div>

                <div className="p-4 rounded-lg font-mono text-sm" 
                     style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    {setupData.backupCodes.map((code, index) => (
                      <div key={index} className="text-center p-1">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={downloadBackupCodes}
                    className="flex-1 py-2 px-4 rounded-lg border"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    📥 Download Codes
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 rounded-lg"
                    style={{ background: 'var(--brand-primary)', color: 'white' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}