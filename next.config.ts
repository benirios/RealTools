import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(fileURLToPath(import.meta.url))

// Per Clerk's documented CSP requirements (clerk.com/docs/guides/secure/best-practices/csp-headers):
// script/connect/frame-src need the FAPI hostname — *.clerk.accounts.dev in dev,
// clerk.realtoolsapp.com in prod (this project's provisioned custom Clerk domain,
// decoded from the pk_live_ key) — plus Cloudflare Turnstile (bot protection) and
// the clerk-telemetry.com beacon.
// script-src needs blob: for the landing page (app/landing-content.json) — its
// unpacker loads React/ReactDOM/Babel-standalone as blob: URL <script src>s.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://clerk.realtoolsapp.com https://*.clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://clerk.realtoolsapp.com https://*.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.realtoolsapp.com https://*.clerk.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  // @sparticuz/chromium-min resolves its (remotely-downloaded) binary via relative
  // /tmp paths at runtime — bundling it (the webpack/turbopack default) breaks that
  // resolution. Keeping it external means Next copies the package's JS as-is.
  serverExternalPackages: ['@sparticuz/chromium-min', 'playwright-core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
