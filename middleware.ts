import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Shared: build a Supabase client and retrieve the current user ─────────────
async function getUser(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as any))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { user, response }
}

function isAdminEmail(email: string | null | undefined): boolean {
  return !!email &&
    email.toLowerCase().trim() === process.env.ADMIN_EMAIL?.toLowerCase().trim()
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Next.js internals & static assets — always pass through ─────────────
  if (
    pathname.startsWith('/_next') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|ico|svg|webp|woff|woff2|gif|ttf|otf|mp4)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // ── 2. API routes — always pass through (routes handle their own auth) ──────
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // ── 3. Admin routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()

    const { user, response } = await getUser(request)
    if (!isAdminEmail(user?.email)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // ── 4. Ungated guest paths (entry / onboarding flow) ─────────────────────
  if (
    pathname === '/' ||
    pathname.startsWith('/splash') ||
    pathname.startsWith('/onboard')
  ) {
    return NextResponse.next()
  }

  // ── 5. Gate check for all remaining guest paths ───────────────────────────
  // Fast path: ik_access cookie present
  if (request.cookies.get('ik_access')?.value === '1') {
    return NextResponse.next()
  }

  // Slow path: check if this is an admin previewing the guest app
  const { user } = await getUser(request)
  if (isAdminEmail(user?.email)) {
    return NextResponse.next()
  }

  // No access — redirect to gate page
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  // Match everything except Next.js static chunks and image optimisation
  matcher: ['/((?!_next/static|_next/image).*)'],
}
