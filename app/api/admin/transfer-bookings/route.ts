import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') ?? 'today' // 'today' | 'upcoming' | 'all'

  const supabase = createServerClient()

  let query = supabase
    .from('bookings')
    .select('*')
    .eq('item_type', 'transfer')
    .order('pickup_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  if (filter === 'today') {
    query = query.gte('pickup_at', todayStart).lt('pickup_at', todayEnd)
  } else if (filter === 'upcoming') {
    query = query.gte('pickup_at', todayStart)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
