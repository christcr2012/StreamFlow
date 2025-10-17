import '../styles/globals.css';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://www.cortiware.com'),
  title: 'Cortiware - AI-Powered Business Management',
  description: 'AI-powered business management platform for service industries. Automate scheduling, estimates, billing, and customer communication.',
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: 'https://www.cortiware.com' },
  openGraph: {
    title: 'Cortiware',
    description: 'AI-powered business management platform for service industries',
    url: 'https://www.cortiware.com',
    siteName: 'Cortiware',
    type: 'website',
    images: ['/og.svg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cortiware',
    description: 'AI-powered business management platform for service industries',
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
            "@type": "SoftwareApplication",
            name: "Cortiware",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: "https://www.cortiware.com"
          }) }}
        />
      </body>
    </html>

  );
}

