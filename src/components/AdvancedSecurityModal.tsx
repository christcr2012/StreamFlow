// src/components/AdvancedSecurityModal.tsx
import { useState, useEffect } from "react";

interface AdvancedSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword?: string;
  newPassword?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  suggestions: string[];
}

interface BreachCheck {
  isChecking: boolean;
  isBreached: boolean | null;
  breachCount?: number;
  error?: string;
}

export default function AdvancedSecurityModal({ 
  isOpen, 
  onClose, 
  currentPassword = "", 
  newPassword = "" 
}: AdvancedSecurityModalProps) {
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], suggestions: [] });
  const [breachCheck, setBreachCheck] = useState<BreachCheck>({ isChecking: false, isBreached: null });
  const [activeTab, setActiveTab] = useState<'strength' | 'breach' | 'policies'>('strength');

  // Analyze password strength in real-time
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, feedback: [], suggestions: [] });
      return;
    }

    const analysis = analyzePasswordStrength(newPassword);
    setPasswordStrength(analysis);
  }, [newPassword]);

  // Check password against known breaches
  const checkPasswordBreach = async (password: string) => {
    if (!password) return;

    setBreachCheck({ isChecking: true, isBreached: null });
    
    try {
      // Use HaveIBeenPwned API to check for breaches
      const response = await fetch('/api/security/check-breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const result = await response.json();
      
      setBreachCheck({
        isChecking: false,
        isBreached: result.breached,
        breachCount: result.count,
        error: result.error,
      });
    } catch (error) {
      setBreachCheck({
        isChecking: false,
        isBreached: null,
        error: 'Failed to check password breach status',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <h2 className="text-2xl font-bold text-gradient">🔧 Advanced Security</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Advanced password security features and policies
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

        {/* Tab Navigation */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
          {[
            { id: 'strength', label: '💪 Password Strength', icon: '💪' },
            { id: 'breach', label: '🔍 Breach Check', icon: '🔍' },
            { id: 'policies', label: '📋 Security Policies', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-gradient border-b-2 border-current' 
                  : 'hover:bg-gray-50'
              }`}
              style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'strength' && (
            <PasswordStrengthTab 
              password={newPassword}
              strength={passwordStrength}
            />
          )}
          
          {activeTab === 'breach' && (
            <BreachCheckTab 
              password={newPassword}
              breachCheck={breachCheck}
              onCheckBreach={checkPasswordBreach}
            />
          )}
          
          {activeTab === 'policies' && (
            <SecurityPoliciesTab />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Password Strength Analysis
function analyzePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  const suggestions: string[] = [];

  // Length checks
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    suggestions.push("Use 12+ characters for stronger security");
  } else {
    suggestions.push("Password is too short. Use at least 8 characters");
  }

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  score += varietyCount;

  if (!hasLower) suggestions.push("Add lowercase letters");
  if (!hasUpper) suggestions.push("Add uppercase letters");
  if (!hasDigit) suggestions.push("Add numbers");
  if (!hasSymbol) suggestions.push("Add symbols (!@#$%^&*)");

  // Common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123|abc|qwe/i, // Sequential patterns
    /password|123456|admin/i, // Common words
  ];

  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      score -= 1;
      suggestions.push("Avoid common patterns and repeated characters");
    }
  });

  // Generate feedback
  if (score >= 6) feedback.push("💚 Strong password");
  else if (score >= 4) feedback.push("🟡 Moderate password");
  else feedback.push("🔴 Weak password");

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
    suggestions: [...new Set(suggestions)], // Remove duplicates
  };
}

// Password Strength Tab Component
function PasswordStrengthTab({ password, strength }: { password: string; strength: PasswordStrength }) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return '#22c55e'; // Green
    if (score >= 2) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Real-time Password Analysis</h3>
        {password ? (
          <div className="space-y-4">
            {/* Strength Meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Password Strength</span>
                <span className="text-sm" style={{ color: getScoreColor(strength.score) }}>
                  {strength.score}/5
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: getScoreColor(strength.score)
                  }}
                />
              </div>
            </div>

            {/* Feedback */}
            {strength.feedback.length > 0 && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                {strength.feedback.map((item, index) => (
                  <div key={index} className="text-sm">{item}</div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {strength.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Suggestions for improvement:</h4>
                <ul className="space-y-1">
                  {strength.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            Enter a new password to see strength analysis
          </div>
        )}
      </div>
    </div>
  );
}

// Breach Check Tab Component
function BreachCheckTab({ 
  password, 
  breachCheck, 
  onCheckBreach 
}: { 
  password: string; 
  breachCheck: BreachCheck; 
  onCheckBreach: (password: string) => void; 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Data Breach Check</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Check if your password has been exposed in known data breaches using the HaveIBeenPwned database.
        </p>

        {password ? (
          <div className="space-y-4">
            <button
              onClick={() => onCheckBreach(password)}
              disabled={breachCheck.isChecking}
              className={`btn-primary ${breachCheck.isChecking ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {breachCheck.isChecking ? '🔄 Checking...' : '🔍 Check for Breaches'}
            </button>

            {/* Results */}
            {breachCheck.isBreached !== null && !breachCheck.isChecking && (
              <div className={`p-4 rounded-lg ${breachCheck.isBreached ? 'bg-red-50' : 'bg-green-50'}`}>
                {breachCheck.isBreached ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 text-lg">⚠️</span>
                      <span className="font-medium text-red-800">Password Found in Breaches</span>
                    </div>
                    <p className="text-red-700 text-sm">
                      This password has been found {breachCheck.breachCount} time(s) in data breaches.
                      Consider using a different password.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-medium text-green-800">Password Not Found in Breaches</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Great! This password hasn't been found in any known data breaches.
                    </p>
                  </div>
                )}
              </div>
            )}

            {breachCheck.error && (
              <div className="p-4 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <span className="font-medium text-yellow-800">Check Failed</span>
                </div>
                <p className="text-yellow-700 text-sm">{breachCheck.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            Enter a new password to check for data breaches
          </div>
        )}
      </div>
    </div>
  );
}

// Security Policies Tab Component
function SecurityPoliciesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Security Policies</h3>
        <div className="space-y-4">
          {[
            {
              title: "Password Requirements",
              items: [
                "Minimum 8 characters (12+ recommended)",
                "Mix of uppercase and lowercase letters", 
                "At least one number",
                "At least one special character",
                "No common words or patterns"
              ]
            },
            {
              title: "Account Security",
              items: [
                "Passwords are encrypted with bcrypt",
                "Failed login attempts are monitored",
                "Account lockout after multiple failed attempts",
                "Session timeout after inactivity"
              ]
            },
            {
              title: "Best Practices",
              items: [
                "Use a unique password for this account",
                "Enable two-factor authentication",
                "Regularly review active sessions",
                "Use a password manager",
                "Update password if compromised"
              ]
            }
          ].map((section, index) => (
            <div key={index} className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <h4 className="font-medium mb-3">{section.title}</h4>
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}