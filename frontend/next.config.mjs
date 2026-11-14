/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/login',
        destination: '/',
      },
      {
        source: '/dashboard',
        destination: '/',
      },
      {
        source: '/billing',
        destination: '/',
      },
      {
        source: '/history',
        destination: '/',
      },
      {
        source: '/analytics',
        destination: '/',
      },
      {
        source: '/settings',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
