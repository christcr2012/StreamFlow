import { cookies } from 'next/headers';
import { loadProviderTheme, generateThemeCSS } from '@/lib/theme-loader';
import '../styles/globals.css';

/**
 * Root Layout for Provider Portal
 * Applies theme from cookie and includes global CSS (which imports theme.css)
 * Injects provider-specific theme CSS variables
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminTheme = cookieStore.get('rs_admin_theme')?.value || 'futuristic-green';

  // Load provider-specific theme settings
  const providerTheme = await loadProviderTheme();
  const themeCSS = generateThemeCSS(providerTheme);

  return (
    <html lang="en" data-theme={adminTheme}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

