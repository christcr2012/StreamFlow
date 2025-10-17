import '@cortiware/themes/globals.css';
import '../../../../branding/Robinson_AI_Systems/tokens.css';
import { ThemeRegistry } from '@cortiware/themes';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  title: 'Cortiware',
  description: 'Business management platform — a Robinson AI Systems product',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Cortiware',
    description: 'Business management platform — a Robinson AI Systems product',
    images: ['/og.svg']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}

