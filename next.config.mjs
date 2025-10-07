import { validateEnv } from './lib/env.server.mjs';

// Validate environment variables during build
if (process.env.NODE_ENV !== 'development') {
  validateEnv();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'cornucopia-dev.vercel.app'],
      bodySizeLimit: '2mb'
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  eslint: {
    ignoreDuringBuilds: true // Temporarily ignore ESLint during builds
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://*.googleapis.com https://maps.googleapis.com https://*.posthog.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com;
              img-src 'self' blob: data: https://*.supabase.co https://*.googleapis.com https://*.gstatic.com https://*.google.com https://maps.gstatic.com https://picsum.photos;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' https://*.supabase.co https://*.googleapis.com https://maps.googleapis.com https://*.posthog.com;
              frame-src 'self' https://www.google.com https://maps.google.com;
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
        ]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'bzkj7i8mse.ufs.sh',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'fzlelklnibjzpgrquzrq.supabase.co',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'swhinhgrtcowjmpstozh.supabase.co',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
