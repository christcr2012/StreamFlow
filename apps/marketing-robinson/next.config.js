const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Code splitting and optimization
  experimental: {
    optimizePackageImports: ['@cortiware/themes', 'lucide-react'],
  },

  // Disable ESLint during builds (run in CI separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/portal/:path*',
        destination: process.env.PROVIDER_PORTAL_URL
          ? `${process.env.PROVIDER_PORTAL_URL}/:path*`
          : 'http://localhost:3000/:path*', // Local dev fallback
      },
    ];
  },
};

// Only apply bundle analyzer when explicitly requested
module.exports = process.env.ANALYZE === 'true'
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;
