import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'

export async function POST() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // Null out bookings.guest_id first to satisfy the FK constraint
  const { error: fkError } = await supabase
    .from('bookings')
    .update({ guest_id: null })
    .not('guest_id', 'is', null)

  if (fkError) return NextResponse.json({ error: fkError.message }, { status: 500 })

  // Now safe to delete all guest rows
  const { error } = await supabase
    .from('guests')
    .delete()
    .gte('created_at', '1970-01-01T00:00:00Z')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
