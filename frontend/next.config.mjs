/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
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
