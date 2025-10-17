import '../styles/globals.css';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://www.robinsonaisystems.com'),
  title: 'Robinson AI Systems, LLC',
  description: 'Enterprise AI consulting and delivery partner — Custom platforms, agent systems, and vertical solutions',
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
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
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

