import withPWA from 'next-pwa';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Fix workspace root warning for multiple lockfiles
  outputFileTracingRoot: process.cwd(),

  // Optimize build performance for minimized codebase
  experimental: {
    // Reduce memory usage and file handles during build
    workerThreads: false,
    cpus: 1,
  },

  // Webpack optimizations for large codebase (32k+ files)
  webpack: (config, { isServer, dev }) => {
    // Critical: Reduce file system pressure
    config.cache = dev ? {
      type: 'filesystem',
      compression: 'gzip',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    } : false;

    // Reduce concurrent file operations
    config.parallelism = 1;

    // Optimize module resolution to reduce file lookups
    config.resolve = {
      ...config.resolve,
      symlinks: false,
      cacheWithContext: false,
    };

    // Disable source maps in production to reduce file I/O
    if (!dev) {
      config.devtool = false;
    }

    // Optimize for large number of files
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: isServer ? undefined : 'single',
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: isServer ? false : {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
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

    // Increase memory limit for webpack
    config.performance = {
      ...config.performance,
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
      hints: false, // Disable warnings
    };

    // Reduce file watching overhead with proper absolute paths
    const rootDir = process.cwd();
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        path.join(rootDir, 'node_modules'),
        path.join(rootDir, '.next'),
        path.join(rootDir, 'ops'),
        path.join(rootDir, 'docs'),
        path.join(rootDir, 'binderFiles'),
        path.join(rootDir, 'attached_assets'),
        '**/node_modules/**',
        '**/.next/**',
        '**/ops/**',
        '**/docs/**',
        '**/binderFiles/**',
        '**/attached_assets/**',
      ],
      aggregateTimeout: 300,
      poll: false,
    };

    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Ignore build errors for generated endpoints (they're templates)
  typescript: {
    // Only fail on critical errors
    ignoreBuildErrors: false,
  },

  eslint: {
    // Don't fail build on lint warnings
    ignoreDuringBuilds: true,
  },
};

// PWA Configuration
const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable in development for easier debugging
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/static.+\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10, // Fall back to cache if network is slow
      },
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

export default pwaConfig(nextConfig);
