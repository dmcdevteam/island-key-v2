import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../../_lib/auth'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('properties')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Only return properties that have at least one guest
  const { data: guestProps } = await supabase
    .from('guests')
    .select('property_id')
    .not('property_id', 'is', null)

  const withGuests = new Set((guestProps ?? []).map((g: any) => g.property_id))
  const filtered = (data ?? []).filter((p: any) => withGuests.has(p.id))

  return NextResponse.json(filtered)
}
