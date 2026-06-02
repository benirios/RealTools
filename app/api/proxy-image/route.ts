import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Derive the project-specific Supabase hostname from env — prevents proxying other tenants' storage
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

function isAllowedHostname(hostname: string): boolean {
  if (/^([a-z0-9-]+\.)*((olx\.com(\.br)?)|zap\.com\.br)$/.test(hostname)) return true
  if (supabaseHostname && hostname === supabaseHostname) return true
  return false
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Não autorizado', { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL ausente', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('URL inválida', { status: 400 })
  }

  if (!isAllowedHostname(parsed.hostname)) {
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
