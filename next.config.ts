import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

export default nextConfig

// TODO(secmaxxing): Add Content-Security-Policy header
// headers: async () => [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'" }] }]
