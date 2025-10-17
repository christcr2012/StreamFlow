'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MobilePanel } from './MobilePanel';
import { NavLinks } from './NavLinks';
import { CTAButton } from './CTAButton';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll for sticky header elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`border-b backdrop-blur-xl sticky top-0 z-sticky transition-all duration-normal ${
        scrolled
          ? 'border-border bg-surface/95 shadow-md'
          : 'border-border/50 bg-surface/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Robinson AI Systems Logo"
            width={132}
            height={132}
            className="h-10 w-auto transition-transform duration-normal group-hover:scale-110"
            priority
          />
          <span className="text-xl sm:text-2xl font-bold text-text tracking-tight hidden sm:inline">
            Robinson AI Systems
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <NavLinks
            className="text-text-muted hover:text-text transition-all duration-fast relative group"
          />
          <CTAButton href="/contact">Contact Us</CTAButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden p-2 text-text-muted hover:text-text transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg rounded-md"
          onClick={() => setMobileMenuOpen(true)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Panel */}
      <MobilePanel open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <div id="mobile-nav" className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <span className="text-xl font-bold text-text">Menu</span>
            <button
              type="button"
              className="p-2 text-text-muted hover:text-text transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Links */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-4">
              <NavLinks
                className="text-lg text-text-muted hover:text-text transition-colors duration-fast py-2"
                onLinkClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="p-6 border-t border-border">
            <CTAButton
              href="/contact"
              className="w-full text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us
            </CTAButton>
          </div>
        </div>
      </MobilePanel>
    </nav>
  );
}

