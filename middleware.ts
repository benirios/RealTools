import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: getUser() — never getSession() (silent security hole per CLAUDE.md, SUMMARY.md pitfall #2)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

  // Unauthenticated user trying to reach a protected route -> /auth/login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user landing on /auth/login or /auth/signup -> /dashboard
  // (Per UI-SPEC line 166: "Authenticated visit to /auth/login -> /dashboard")
  if (
    user &&
    (request.nextUrl.pathname === '/auth/login' ||
      request.nextUrl.pathname === '/auth/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /om/*              (public OM pages — Phase 2)
     * - /api/track/*       (tracking pixel — Phase 3)
     * - /api/proxy-image   (image proxy — no session cookie in img requests)
     * - /auth/callback     (PKCE handler must run without our redirect logic)
     * - _next/static, _next/image, favicon, common image files
     */
    '/((?!om|api/track|api/proxy-image|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
