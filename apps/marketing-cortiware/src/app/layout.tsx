import '../styles/globals.css';
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','700'], display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://www.cortiware.com'),
  title: 'Vertical Packs by Robinson AI Systems',
  description: 'Industry-specific AI solutions ready to deploy — Healthcare, Legal, Real Estate, Finance, and more',
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: 'https://www.cortiware.com' },
  openGraph: {
    title: 'Cortiware',
    description: 'Business management platform — a Robinson AI Systems product',
    url: 'https://www.cortiware.com',
    siteName: 'Cortiware',
    type: 'website',
    images: ['/og.svg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cortiware',
    description: 'Business management platform — a Robinson AI Systems product',
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

