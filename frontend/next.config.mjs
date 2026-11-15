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
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
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
