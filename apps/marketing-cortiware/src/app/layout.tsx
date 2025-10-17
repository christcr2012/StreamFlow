import '@cortiware/themes/globals.css';
import '../../../../branding/Robinson_AI_Systems/tokens.css';
import { ThemeRegistry } from '@cortiware/themes';

export const metadata = {
  title: 'Cortiware',
  description: 'Business management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}

