/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/webhook/:path*',
        destination: 'http://localhost:3000/webhook/:path*',
      },
    ];
  },
};

module.exports = nextConfig;