import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Robinson AI Systems',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Page Not Found</h2>
          <p className="text-xl text-text-muted mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal"
          >
            Contact Support
          </Link>
        </div>

        <div className="text-left">
          <h3 className="text-lg font-semibold text-text mb-3">Popular Pages:</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/services" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                Services & Solutions
              </Link>
            </li>
            <li>
              <Link href="/security" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                Security & Compliance
              </Link>
            </li>
            <li>
              <Link href="/why" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                Why Robinson AI Systems
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

