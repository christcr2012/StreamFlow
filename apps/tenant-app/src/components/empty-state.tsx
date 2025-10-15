import { Button } from '@cortiware/ui';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex gap-3 justify-center">
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button variant="primary">{action.label}</Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="secondary">{secondaryAction.label}</Button>
              </Link>
            ) : (
              <Button variant="secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */

export function NoCustomersEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No customers yet"
      description="Get started by adding your first customer. You can track their contact information, jobs, and invoices all in one place."
      action={{
        label: 'Add Customer',
        href: '/customers/new',
      }}
    />
  );
}

export function NoJobsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      title="No jobs yet"
      description="Create your first job to start tracking work for your customers. You can schedule jobs, track progress, and add photos."
      action={{
        label: 'Create Job',
        href: '/jobs/new',
      }}
    />
  );
}

export function NoInvoicesEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="No invoices yet"
      description="Create your first invoice to bill customers for your services. You can send invoices via email and accept online payments."
      action={{
        label: 'Create Invoice',
        href: '/invoices/new',
      }}
    />
  );
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear Search',
        onClick: () => window.location.reload(),
      }}
    />
  );
}

export function NoPaymentsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      }
      title="No payments yet"
      description="Payments will appear here once customers pay their invoices. You can accept payments online with Stripe."
      action={{
        label: 'Configure Stripe',
        href: '/settings/integrations',
      }}
    />
  );
}

export function ErrorEmptyState({ 
  title = 'Something went wrong',
  description = 'We encountered an error loading this data. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : undefined}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
    />
  );
}

