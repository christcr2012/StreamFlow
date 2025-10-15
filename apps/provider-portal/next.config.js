const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: ['@cortiware/auth-service', '@cortiware/themes', '@cortiware/db', '@cortiware/kv'],

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Code splitting and optimization
    optimizePackageImports: ['@cortiware/ui', '@cortiware/ui-components', 'lucide-react'],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    } else {
      // Only optimize client-side bundles
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

// Only apply bundle analyzer when explicitly requested
if (process.env.ANALYZE === 'true') {
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}

