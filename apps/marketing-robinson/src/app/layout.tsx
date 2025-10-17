import '@cortiware/themes/src/themes.css';
import '@cortiware/themes/src/brand/robinson/tokens.css';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  title: 'Robinson AI Systems',
  description: 'Enterprise AI solutions',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Robinson AI Systems',
    description: 'Enterprise AI solutions',
    images: ['/og.svg']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}

