// src/pages/dev/test-accounts.tsx

/**
 * 🧪 DEV TEST ACCOUNTS VERIFICATION
 * 
 * Test page to verify that dev test accounts work correctly.
 * Tests authentication with any password for development users.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import DeveloperLayout from '@/components/DeveloperLayout';

interface TestResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export default function TestAccountsPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testAccounts = [
    { email: 'owner@test.com', role: 'OWNER', description: 'Full admin access' },
    { email: 'manager@test.com', role: 'MANAGER', description: 'Manager-level access' },
    { email: 'staff@test.com', role: 'STAFF', description: 'Staff-level access' }
  ];

  const testPasswords = ['password', 'test123', 'anything', ''];

  const testLogin = async (email: string, password: string): Promise<TestResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      return {
        email,
        password,
        success: response.ok && data.ok,
        error: data.error,
        redirectUrl: data.redirectUrl
      };
    } catch (error) {
      return {
        email,
        password,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];

    for (const account of testAccounts) {
      for (const password of testPasswords) {
        console.log(`Testing ${account.email} with password: "${password}"`);
        const result = await testLogin(account.email, password);
        results.push(result);
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const testSingleAccount = async (email: string) => {
    setIsRunning(true);
    
    const result = await testLogin(email, 'test123');
    setTestResults([result]);
    
    setIsRunning(false);
  };

  const getResultsByAccount = (email: string) => {
    return testResults.filter(r => r.email === email);
  };

  return (
    <DeveloperLayout title="Test Accounts Verification">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              🧪 Dev Test Accounts
            </h1>
            <p className="text-slate-400 mt-2">
              Verify that development test accounts work with any password
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
            >
              {isRunning ? 'Testing...' : 'Test All Accounts'}
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Environment Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-green-400 font-medium mb-2">Current Environment</h3>
              <p className="text-slate-300">NODE_ENV: {process.env.NODE_ENV || 'development'}</p>
              <p className="text-slate-300">Dev Users Enabled: {process.env.NODE_ENV !== 'production' ? '✅ Yes' : '❌ No'}</p>
            </div>
            <div>
              <h3 className="text-green-400 font-medium mb-2">Test Account Emails</h3>
              <div className="space-y-1">
                <p className="text-slate-300 text-sm">owner@test.com</p>
                <p className="text-slate-300 text-sm">manager@test.com</p>
                <p className="text-slate-300 text-sm">staff@test.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {testAccounts.map((account) => (
            <div key={account.email} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{account.role}</h3>
                  <p className="text-slate-400 text-sm">{account.description}</p>
                </div>
                <div className="text-2xl">
                  {account.role === 'OWNER' ? '👑' : account.role === 'MANAGER' ? '👨‍💼' : '👷'}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Email:</p>
                  <p className="text-green-400 font-mono text-sm">{account.email}</p>
                </div>

                <div>
                  <p className="text-slate-300 text-sm font-medium">Password:</p>
                  <p className="text-slate-400 text-sm">Any password should work</p>
                </div>

                <button
                  onClick={() => testSingleAccount(account.email)}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Test Login
                </button>

                {/* Test Results for this account */}
                {getResultsByAccount(account.email).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-slate-300 text-sm font-medium">Test Results:</h4>
                    {getResultsByAccount(account.email).map((result, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-xs ${
                          result.success 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Password: "{result.password}"</span>
                          <span>{result.success ? '✅' : '❌'}</span>
                        </div>
                        {result.error && (
                          <p className="mt-1 text-red-300">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Test Results */}
        {testResults.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Detailed Test Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">Email</th>
                    <th className="text-left py-3 px-4 text-slate-300">Password</th>
                    <th className="text-left py-3 px-4 text-slate-300">Result</th>
                    <th className="text-left py-3 px-4 text-slate-300">Redirect URL</th>
                    <th className="text-left py-3 px-4 text-slate-300">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300 font-mono text-sm">{result.email}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-sm">"{result.password}"</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {result.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">{result.redirectUrl || '-'}</td>
                      <td className="py-3 px-4 text-red-400 text-sm">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-4">How to Use Dev Test Accounts</h2>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="text-blue-400 font-medium mb-2">1. Login with Test Accounts</h3>
              <p className="text-sm">Use any of the test emails (owner@test.com, manager@test.com, staff@test.com) with ANY password to login.</p>
            </div>
            <div>
              <h3 className="text-blue-400 font-medium mb-2">2. Role-Based Testing</h3>
              <p className="text-sm">Each test account has different permissions to test role-based access control (RBAC).</p>
            </div>
            <div>
              <h3 className="text-blue-400 font-medium mb-2">3. Development Only</h3>
              <p className="text-sm">These accounts only work in development/staging environments, not in production.</p>
            </div>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
}
