import { NextResponse } from 'next/server'

// Clears the ik_access cookie so the admin can test the gate without DevTools.
// No auth required — it only clears a non-sensitive client-side cookie.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const res = NextResponse.redirect(new URL('/', origin))
  res.cookies.set('ik_access', '', {
    path:     '/',
    maxAge:   0,
    sameSite: 'lax',
  })
  return res
}
