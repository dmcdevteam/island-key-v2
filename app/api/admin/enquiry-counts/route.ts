import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('item_type')
    .eq('status', 'enquiry')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {
    activity: 0, transfer: 0, rental: 0,
    bike_rental: 0, boat_rental: 0, service: 0,
    essentials: 0, total: 0,
  }

  for (const row of data ?? []) {
    const t = row.item_type as string
    if (t in counts) counts[t]++
    counts.total++
  }

  return NextResponse.json({ counts })
}
