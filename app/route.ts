import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import landing from './landing-content.json'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (userId) {
    return NextResponse.redirect(new URL('/decision-surface', request.url))
  }

  return new NextResponse(landing.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
