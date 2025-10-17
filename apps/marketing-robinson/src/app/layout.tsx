import '@cortiware/themes/src/themes.css';
import '@cortiware/themes/src/brand/robinson/tokens.css';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://www.robinsonaisystems.com'),
  title: 'Robinson AI Systems',
  description: 'Enterprise AI solutions',
  icons: { icon: '/favicon.png' },
  alternates: { canonical: 'https://www.robinsonaisystems.com' },
  openGraph: {
    title: 'Robinson AI Systems',
    description: 'Enterprise AI solutions',
    url: 'https://www.robinsonaisystems.com',
    siteName: 'Robinson AI Systems',
    type: 'website',
    images: ['/og.svg']
  },
  twitter: {
    card: 'summary_large_image',
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
        <script type="application/ld+json" suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Robinson AI Systems",
            url: "https://www.robinsonaisystems.com",
            logo: "https://www.robinsonaisystems.com/favicon.png"
          }) }}
        />
      </body>
    </html>

  );
}

