/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow all hosts for Replit environment
  async rewrites() {
    return []
  },
  experimental: {
    allowedHosts: true
  }
};
export default nextConfig;
