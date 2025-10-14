'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function MFASettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  async function fetchMFAStatus() {
    try {
      const res = await fetch('/api/provider/mfa/status');
      const data = await res.json();
      setMfaEnabled(data.enabled);
    } catch (err) {
      console.error('Failed to fetch MFA status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setEnrolling(true);
    setError('');
    
    try {
      const res = await fetch('/api/provider/mfa/enroll', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start enrollment');
      }
      
      setSecret(data.secret);
      
      // Generate QR code
      const otpauthUrl = `otpauth://totp/Cortiware:Provider?secret=${data.secret}&issuer=Cortiware`;
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrDataUrl);
    } catch (err: any) {
      setError(err.message);
      setEnrolling(false);
    }
  }

  async function verifyAndEnable() {
    setError('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    try {
      const res = await fetch('/api/provider/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode, secret }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid code');
      }
      
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setMfaEnabled(true);
      setSuccess('MFA enabled successfully!');
      setEnrolling(false);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function disableMFA() {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return;
    }
    
    setError('');
    
    try {
      const res = await fetch('/api/provider/mfa/disable', { method: 'POST' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disable MFA');
      }
      
      setMfaEnabled(false);
      setSuccess('MFA disabled successfully');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function regenerateBackupCodes() {
    if (!confirm('This will invalidate your existing backup codes. Continue?')) {
      return;
    }
    
    setError('');
    
    try {
      const res = await fetch('/api/provider/mfa/regenerate-backup-codes', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }
      
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('Backup codes regenerated successfully');
    } catch (err: any) {
      setError(err.message);
    }
  }

  function downloadBackupCodes() {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cortiware-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Multi-Factor Authentication</h1>
        <p className="text-gray-600 mb-8">
          Add an extra layer of security to your account with two-factor authentication.
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

        {!mfaEnabled && !enrolling && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">MFA is not enabled</h2>
            <p className="text-gray-600 mb-4">
              Enable MFA to protect your account with time-based one-time passwords (TOTP).
              You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
            <button
              onClick={startEnrollment}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enable MFA
            </button>
          </div>
        )}

        {enrolling && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Set up MFA</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="border p-4 rounded" />
                </div>
              )}
              <p className="text-sm text-gray-600 mb-2">
                Or enter this secret manually:
              </p>
              <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
                {secret}
              </code>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Step 2: Verify Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full max-w-xs px-4 py-2 border rounded"
                maxLength={6}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={verifyAndEnable}
                disabled={verificationCode.length !== 6}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify and Enable
              </button>
              <button
                onClick={() => {
                  setEnrolling(false);
                  setQrCodeUrl('');
                  setSecret('');
                  setVerificationCode('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mfaEnabled && !enrolling && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">MFA is enabled</h2>
                <p className="text-sm text-gray-600">Your account is protected with MFA</p>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={regenerateBackupCodes}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Regenerate Backup Codes
              </button>
              
              <button
                onClick={disableMFA}
                className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50"
              >
                Disable MFA
              </button>
            </div>
          </div>
        )}

        {showBackupCodes && backupCodes.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Save Your Backup Codes</h2>
            <p className="text-sm text-gray-700 mb-4">
              Store these backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.
            </p>
            
            <div className="bg-white p-4 rounded border mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={downloadBackupCodes}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Codes
              </button>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                I&apos;ve Saved These Codes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

