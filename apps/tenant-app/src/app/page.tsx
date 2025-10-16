import { redirect } from 'next/navigation';

/**
 * Tenant App Root Page
 *
 * Redirects to the cleaning leads page as the default landing page.
 * Users should access the app through authenticated routes.
 */
export default function TenantAppPage() {
  // Redirect to cleaning leads as the default landing page
  redirect('/cleaning/leads');
}

