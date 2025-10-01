// src/pages/customer/login.tsx
// Customer Portal Login
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function CustomerLogin() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify token by calling dashboard API
      const response = await fetch('/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid access token');
      }

      // Store token
      localStorage.setItem('customer_token', token);

      // Redirect to dashboard
      router.push('/customer');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Portal Login</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
              <p className="text-gray-600">Enter your access token to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Your access token was provided by your service provider
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Verifying...' : 'Access Portal'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an access token?{' '}
                <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                  Contact your service provider
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Powered by StreamFlow</p>
          </div>
        </div>
      </div>
    </>
  );
}

