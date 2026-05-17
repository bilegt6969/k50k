/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
          },
          { key: 'Access-Control-Allow-Headers', value: '*' },
          { key: 'Access-Control-Expose-Headers', value: '*' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.goat.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: "cdn2.thecatapi.com"
      },
      {
        protocol: 'https',
        hostname: "graph.facebook.com"
      },
      {
        protocol: 'https',
        hostname: "i.ebayimg.com"
      },
      {
        protocol: 'https',
        hostname: 'images.stockx.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
 };

export default nextConfig;