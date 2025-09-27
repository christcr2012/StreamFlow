/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix workspace root warning for multiple lockfiles
  outputFileTracingRoot: process.cwd(),
  // Allow all hosts for Replit environment - using hostname instead of experimental
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  }
};
export default nextConfig;
