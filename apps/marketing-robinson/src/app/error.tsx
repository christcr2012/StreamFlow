'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold gradient-text mb-4">500</h1>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Something Went Wrong</h2>
          <p className="text-xl text-text-muted mb-8">
            We&apos;re sorry, but something unexpected happened. Our team has been notified.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal inline-block"
          >
            Go Home
          </Link>
        </div>

        <div className="enterprise-card p-6 text-left">
          <h3 className="text-lg font-semibold text-text mb-3">Need Help?</h3>
          <p className="text-text-muted mb-4">
            If this problem persists, please contact our support team with the error details below.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              <span className="font-semibold">Email:</span>{' '}
              <a
                href="mailto:support@robinsonaisystems.com"
                className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast"
              >
                support@robinsonaisystems.com
              </a>
            </p>
            {error.digest && (
              <p className="text-sm text-text-muted">
                <span className="font-semibold">Error ID:</span> {error.digest}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

