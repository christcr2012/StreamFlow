/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
