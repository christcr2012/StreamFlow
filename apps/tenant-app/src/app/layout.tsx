import { cookies } from 'next/headers';
import { DirectAccessBanner } from '@/components/DirectAccessBanner';
import { getAuthContext } from '@/lib/auth-context';
import { ToastContainer } from '@/components/ui/toast';
import { ClientLayoutWrapper } from '@/components/client-layout-wrapper';
import '../styles/globals.css';
import { DEFAULT_THEME } from '@cortiware/themes';

export const metadata = {
  title: 'Cortiware App',
  description: 'Tenant application',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getAuthContext();
  const cookieStore = await cookies();
  const clientTheme = cookieStore.get('rs_client_theme')?.value || DEFAULT_THEME;

  return (
    <html lang="en" data-theme={clientTheme} suppressHydrationWarning>
      <body>
        <ClientLayoutWrapper>
          {authContext.isDirectAccess && authContext.role && authContext.email && (
            <DirectAccessBanner
              role={authContext.role as 'provider' | 'developer'}
              email={authContext.email}
            />
          )}
          {children}
          <ToastContainer />
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}

