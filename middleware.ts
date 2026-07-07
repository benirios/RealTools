import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/signup(.*)',
  '/om(.*)',
  '/unsubscribe(.*)',
  '/api/track(.*)',
  '/api/unsubscribe(.*)',
  '/api/proxy-image(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
