/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  assetPrefix: '',
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ayisigicafe.com',
      },
    ],
  },

  trailingSlash: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
}

export default nextConfig