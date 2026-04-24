import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for standalone output in container
  // output: 'standalone', // uncomment for Docker
  experimental: {
    // Enables 'use cache' directive support in Next.js 15
    useCache: true,
    // dynamicIO enables 'use cache' properly in Next.js 15
    // dynamicIO: true,
  },
}

export default nextConfig
