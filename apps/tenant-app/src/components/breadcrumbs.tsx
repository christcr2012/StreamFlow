import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb Navigation Component
 * 
 * Can be used with explicit items or auto-generate from pathname
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}

            {isLast || !item.href ? (
              <span className="text-gray-900 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/dashboard',
  });

  // Map of route segments to labels
  const labelMap: Record<string, string> = {
    customers: 'Customers',
    jobs: 'Jobs',
    invoices: 'Invoices',
    settings: 'Settings',
    integrations: 'Integrations',
    new: 'New',
    edit: 'Edit',
  };

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip dashboard since we already added it
    if (segment === 'dashboard') {
      continue;
    }

    // Check if this is an ID (typically a cuid or UUID)
    const isId = segment.length > 10 && /^[a-z0-9]+$/i.test(segment);

    if (isId) {
      // For IDs, use a generic label or fetch from context
      breadcrumbs.push({
        label: 'Details',
        href: currentPath,
      });
    } else {
      // Use mapped label or capitalize segment
      const label = labelMap[segment] || capitalize(segment);
      
      // Don't link the last segment
      const isLast = i === segments.length - 1;
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pre-configured breadcrumbs for common pages
 */

export function CustomersBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Customers' },
      ]}
    />
  );
}

export function CustomerDetailBreadcrumbs({ customerName }: { customerName: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Customers', href: '/customers' },
        { label: customerName },
      ]}
    />
  );
}

export function NewCustomerBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Customers', href: '/customers' },
        { label: 'New Customer' },
      ]}
    />
  );
}

export function JobsBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Jobs' },
      ]}
    />
  );
}

export function JobDetailBreadcrumbs({ jobTitle }: { jobTitle: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Jobs', href: '/jobs' },
        { label: jobTitle },
      ]}
    />
  );
}

export function NewJobBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Jobs', href: '/jobs' },
        { label: 'New Job' },
      ]}
    />
  );
}

export function InvoicesBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Invoices' },
      ]}
    />
  );
}

export function InvoiceDetailBreadcrumbs({ invoiceNumber }: { invoiceNumber: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Invoices', href: '/invoices' },
        { label: `Invoice ${invoiceNumber}` },
      ]}
    />
  );
}

export function NewInvoiceBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Invoices', href: '/invoices' },
        { label: 'New Invoice' },
      ]}
    />
  );
}

export function SettingsBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings' },
      ]}
    />
  );
}

export function IntegrationsBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings' },
        { label: 'Integrations' },
      ]}
    />
  );
}

