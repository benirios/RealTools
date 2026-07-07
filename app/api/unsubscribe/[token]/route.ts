import { type NextRequest, NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/tracking/unsubscribe'

/**
 * Public unsubscribe endpoint — /api/unsubscribe/[token]
 *
 * POST: RFC 8058 one-click target (mail clients auto-POST here when
 * List-Unsubscribe-Post is present). Always 200, same body regardless of
 * token validity — no probing signal (mirrors /api/track/[token]).
 *
 * GET: manual link click from the email body — same effect, redirects to a
 * human-readable confirmation page.
 *
 * Already excluded from middleware auth check (middleware.ts matcher).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  await unsubscribeByToken(token)
  return new NextResponse(null, { status: 200 })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  await unsubscribeByToken(token)
  return NextResponse.redirect(new URL('/unsubscribe/confirmado', req.url))
}
