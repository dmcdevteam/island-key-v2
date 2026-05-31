import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { notification_id, guest_id } = await request.json()
  if (!notification_id || !guest_id) {
    return NextResponse.json({ error: 'notification_id and guest_id required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('notification_reads')
    .upsert({ notification_id, guest_id }, { onConflict: 'notification_id,guest_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
