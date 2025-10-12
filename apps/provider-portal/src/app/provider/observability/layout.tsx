import { ReactNode } from 'react';
import Link from 'next/link';

export default function ObservabilityLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Observability & Monitoring</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor system health, track metrics, and identify issues
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/provider/observability/federation-health"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Federation Health
          </Link>
          <Link
            href="/provider/observability/monetization-metrics"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Monetization Metrics
          </Link>
          <Link
            href="/provider/observability/api-usage"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            API Usage
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}

