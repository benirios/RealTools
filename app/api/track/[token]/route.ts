import { type NextRequest } from 'next/server'
import { recordOmOpenByToken } from '@/lib/tracking/record-om-open'

// 1x1 transparent GIF (43 bytes, base64-encoded)
// Source: canonical minimal GIF used in tracking pixels
const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

/**
 * Public tracking pixel endpoint — /api/track/[token]
 *
 * Security behavior (STRIDE T-03-07, T-03-08):
 *  - Always returns HTTP 200 + 1x1 GIF, regardless of token validity.
 *  - Invalid or already-used tokens produce the same response as valid first opens.
 *  - This prevents attackers from probing whether a tracking token exists.
 *
 * Already excluded from middleware auth check (middleware.ts matcher).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Fire-and-forget: idempotent open recorder — unknown or repeat tokens are no-ops
  // Do NOT await in a way that delays the GIF response unnecessarily; however,
  // in Next.js Route Handlers the response only sends after the function returns,
  // so we await to ensure the DB write completes before the response is sent.
  // This keeps the handler simple and correct.
  await recordOmOpenByToken(token)

  return new Response(GIF_1x1, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  })
}
