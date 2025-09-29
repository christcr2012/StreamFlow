// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

/**
 * 📱 CUSTOM DOCUMENT WITH PWA SUPPORT
 * 
 * This custom document includes all necessary PWA meta tags,
 * manifest linking, and theme configuration for a complete
 * Progressive Web App experience.
 */

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="StreamFlow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StreamFlow" />
        <meta name="description" content="Enterprise-grade business management platform with multi-tenant architecture, offline capabilities, and comprehensive workflow automation." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1e293b" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#1e293b" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />

        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.jpg" sizes="2048x2732" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.jpg" sizes="1668x2224" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.jpg" sizes="1536x2048" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.jpg" sizes="1125x2436" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.jpg" sizes="1242x2208" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.jpg" sizes="640x1136" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png" />
        <meta name="msapplication-square70x70logo" content="/icons/mstile-70x70.png" />
        <meta name="msapplication-square150x150logo" content="/icons/mstile-150x150.png" />
        <meta name="msapplication-wide310x150logo" content="/icons/mstile-310x150.png" />
        <meta name="msapplication-square310x310logo" content="/icons/mstile-310x310.png" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Viewport Meta Tag for Mobile */}
        <meta 
          name="viewport" 
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" 
        />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="StreamFlow Enterprise Platform" />
        <meta property="og:description" content="Enterprise-grade business management platform with multi-tenant architecture, offline capabilities, and comprehensive workflow automation." />
        <meta property="og:site_name" content="StreamFlow" />
        <meta property="og:url" content="https://stream-flow-xi.vercel.app" />
        <meta property="og:image" content="/icons/og-image.png" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StreamFlow Enterprise Platform" />
        <meta name="twitter:description" content="Enterprise-grade business management platform with multi-tenant architecture, offline capabilities, and comprehensive workflow automation." />
        <meta name="twitter:image" content="/icons/twitter-image.png" />

        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

        {/* Prevent zoom on input focus (iOS) */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

        {/* Chrome/Edge specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Samsung Internet specific */}
        <meta name="theme-color" content="#1e293b" />
        <meta name="color-scheme" content="dark" />

        {/* Disable pull-to-refresh on mobile */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              overscroll-behavior-y: contain;
            }
            
            /* Prevent iOS bounce effect */
            html, body {
              height: 100%;
              overflow: hidden;
            }
            
            #__next {
              height: 100%;
              overflow: auto;
            }
            
            /* PWA specific styles */
            @media (display-mode: standalone) {
              body {
                -webkit-user-select: none;
                -webkit-touch-callout: none;
              }
            }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
