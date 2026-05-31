import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const guest_id    = searchParams.get('guest_id')
  const property_id = searchParams.get('property_id')

  const supabase = createServerClient()
  const now      = new Date().toISOString()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('is_active', true)
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  // Build OR conditions for target filtering
  const conditions = ['target.eq.all']
  if (guest_id)    conditions.push(`target_guest_id.eq.${guest_id}`)
  if (property_id) conditions.push(`target_property_id.eq.${property_id}`)

  query = query.or(conditions.join(','))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch reads for this guest so we can mark unread
  let readIds = new Set<string>()
  if (guest_id) {
    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('guest_id', guest_id)
    readIds = new Set((reads ?? []).map((r: any) => r.notification_id))
  }

  const notifications = (data ?? []).map((n: any) => ({
    ...n,
    is_read: readIds.has(n.id),
  }))

  return NextResponse.json({ notifications })
}
