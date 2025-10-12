'use client';

import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/monetization/plans', description: 'List all price plans' },
  { method: 'GET', path: '/api/monetization/prices', description: 'List all plan prices' },
  { method: 'GET', path: '/api/monetization/coupons', description: 'List all coupons' },
  { method: 'GET', path: '/api/federation/keys', description: 'List federation keys' },
  { method: 'GET', path: '/api/federation/oidc', description: 'Get OIDC configuration' },
  { method: 'POST', path: '/api/monetization/plans', description: 'Create a price plan' },
  { method: 'POST', path: '/api/monetization/prices', description: 'Create a plan price' },
  { method: 'POST', path: '/api/federation/keys', description: 'Create federation key' },
];

export default function APIExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Explorer</h1>
        <p className="mt-2 text-sm text-gray-600">
          Test API endpoints with live requests and see real-time responses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endpoints</h3>
              <div className="space-y-2">
                {API_ENDPOINTS.map((endpoint, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedEndpoint === endpoint
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                        endpoint.method === 'GET'
                          ? 'bg-green-100 text-green-800'
                          : endpoint.method === 'POST'
                          ? 'bg-blue-100 text-blue-800'
                          : endpoint.method === 'PATCH'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-xs">{endpoint.path}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Request/Response Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Panel */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Request</h3>
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Executing...' : 'Execute'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint
                  </label>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedEndpoint.method === 'GET'
                          ? 'bg-green-100 text-green-800'
                          : selectedEndpoint.method === 'POST'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedEndpoint.method === 'PATCH'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <code className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm">
                      {selectedEndpoint.path}
                    </code>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{selectedEndpoint.description}</p>
                </div>

                {selectedEndpoint.method !== 'GET' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Response Panel */}
          {(response || error) && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Response</h3>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {response && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                            response.status >= 200 && response.status < 300
                              ? 'bg-green-100 text-green-800'
                              : response.status >= 400
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {response.status} {response.statusText}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Body
                      </label>
                      <pre className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md overflow-auto max-h-96 text-sm">
                        {JSON.stringify(response.body, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Headers
                      </label>
                      <pre className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md overflow-auto max-h-48 text-sm">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

