import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'

export async function GET(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const propertyId      = searchParams.get('property_id')
  const checkInFrom     = searchParams.get('check_in_from')
  const checkInTo       = searchParams.get('check_in_to')
  const checkOutFrom    = searchParams.get('check_out_from')
  const checkOutTo      = searchParams.get('check_out_to')
  const groupType       = searchParams.get('group_type')
  const region          = searchParams.get('region')
  const whatsappOptedIn = searchParams.get('whatsapp_opted_in')

  const supabase = createServerClient()

  let query = supabase
    .from('guests')
    .select(`
      id, first_name, property_id, accommodation_name, tier, region,
      check_in, check_out, group_type, group_size,
      adults, children, whatsapp_number, whatsapp_opted_in,
      user_agent, created_at,
      properties!property_id ( name, slug )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (propertyId)      query = query.eq('property_id', propertyId)
  if (checkInFrom)     query = query.gte('check_in', checkInFrom)
  if (checkInTo)       query = query.lte('check_in', checkInTo)
  if (checkOutFrom)    query = query.gte('check_out', checkOutFrom)
  if (checkOutTo)      query = query.lte('check_out', checkOutTo)
  if (groupType)       query = query.eq('group_type', groupType)
  if (region)          query = query.eq('region', region)
  if (whatsappOptedIn !== null) query = query.eq('whatsapp_opted_in', whatsappOptedIn === 'true')

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten the joined property fields
  const rows = (data ?? []).map((g: any) => ({
    ...g,
    property_name: g.properties?.name ?? null,
    property_slug: g.properties?.slug ?? null,
    properties: undefined,
  }))

  return NextResponse.json(rows)
}
