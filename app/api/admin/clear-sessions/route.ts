import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

export async function POST() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // Delete all guest rows (UUID PK so RESTART IDENTITY is a no-op)
  const { error } = await supabase
    .from('guests')
    .delete()
    .gte('created_at', '1970-01-01T00:00:00Z') // matches every row

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
