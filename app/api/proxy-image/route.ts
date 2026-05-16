import { NextRequest, NextResponse } from 'next/server'

// Allow any subdomain of olx.com, olx.com.br, zap.com.br (OLX group CDNs)
const ALLOWED_HOSTNAMES = /^([a-z0-9-]+\.)*((olx\.com(\.br)?)|zap\.com\.br)$/

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (!ALLOWED_HOSTNAMES.test(parsed.hostname)) {
    return new NextResponse('Disallowed host', { status: 403 })
  }

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Referer: 'https://www.olx.com.br/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })
  } catch {
    return new NextResponse('Fetch failed', { status: 502 })
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || !contentType.startsWith('image/')) {
    return new NextResponse('Not an image', { status: 400 })
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
