'use client';

import Link from 'next/link';

export default function DeveloperOverviewPage() {
  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
        <p className="mt-2 text-sm text-gray-600">
          Build, test, and monitor your integrations with our platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* API Explorer Card */}
        <Link
          href="/developer/api-explorer"
          className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">API Explorer</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Test API endpoints with live requests and see real-time responses
            </p>
          </div>
        </Link>

        {/* API Keys Card */}
        <Link
          href="/developer/keys"
          className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Manage app-scoped API keys for secure authentication
            </p>
          </div>
        </Link>

        {/* Webhooks Card */}
        <Link
          href="/developer/webhooks"
          className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Webhooks</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Test webhook integrations in a sandbox environment
            </p>
          </div>
        </Link>

        {/* Usage Dashboard Card */}
        <Link
          href="/developer/usage"
          className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Usage Dashboard</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Monitor API consumption metrics and track usage patterns
            </p>
          </div>
        </Link>

        {/* Documentation Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Documentation</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Comprehensive guides and API reference documentation
            </p>
            <div className="mt-4">
              <a
                href="/docs"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View Docs →
              </a>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Support</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Get help from our developer support team
            </p>
            <div className="mt-4">
              <a
                href="mailto:dev-support@cortiware.com"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="mt-12 bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create an API key in the <Link href="/developer/keys" className="text-blue-600 hover:text-blue-500">API Keys</Link> section</li>
              <li>Test your first API call in the <Link href="/developer/api-explorer" className="text-blue-600 hover:text-blue-500">API Explorer</Link></li>
              <li>Set up webhooks to receive real-time events</li>
              <li>Monitor your usage and track API consumption</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

