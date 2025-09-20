import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Optimize for production  
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Disable ESLint during build for faster development
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Handle font loading issues during Docker build
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
