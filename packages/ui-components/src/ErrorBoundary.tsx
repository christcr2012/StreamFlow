/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI
 * Prevents entire app crashes from component errors
 */
import React from 'react';

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          backgroundColor: '#fef2f2'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#7c2d12' }}>
                Error details
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#fff',
                border: '1px solid #fca5a5',
                borderRadius: '0.25rem',
                overflow: 'auto',
                fontSize: '0.875rem',
                color: '#7c2d12'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

