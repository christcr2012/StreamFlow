import '@cortiware/themes/globals.css';
import '../../../../branding/Robinson_AI_Systems/tokens.css';
import { ThemeRegistry } from '@cortiware/themes';

export const metadata = {
  title: 'Robinson AI Systems',
  description: 'Enterprise AI solutions',
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

