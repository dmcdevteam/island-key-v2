import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const key = (body.key as string | undefined)?.trim().toUpperCase()

    if (!key) {
      return NextResponse.json({ valid: false, message: 'No key provided' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('access_keys')
      .select('id, is_active, expires_at, uses_remaining, total_uses')
      .eq('key', key)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired access key' })
    }

    // Validate active flag
    if (!data.is_active) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired access key' })
    }

    // Validate expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired access key' })
    }

    // Validate uses
    if (data.uses_remaining !== null && data.uses_remaining <= 0) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired access key' })
    }

    // Increment usage counters
    await supabase
      .from('access_keys')
      .update({
        total_uses:     (data.total_uses ?? 0) + 1,
        uses_remaining: data.uses_remaining !== null ? data.uses_remaining - 1 : null,
      })
      .eq('id', data.id)

    // Return success and set the access cookie server-side
    const res = NextResponse.json({ valid: true })
    res.cookies.set('ik_access', '1', {
      path:     '/',
      maxAge:   60 * 60 * 24 * 90, // 90 days
      sameSite: 'lax',
      httpOnly: false, // readable by JS for client-side checks
    })
    return res

  } catch (err) {
    console.error('[validate-key]', err)
    return NextResponse.json({ valid: false, message: 'Server error — please try again' }, { status: 500 })
  }
}
