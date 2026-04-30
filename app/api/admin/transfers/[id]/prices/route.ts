import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../../_lib/auth'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('transfer_prices')
    .select('*, vehicle_types(name, slug)')
    .eq('route_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const prices: Array<{
    vehicle_type_id: string | null
    price: number
    original_price: number | null
    discount_label: string | null
    max_passengers: number | null
    max_luggage: number | null
    notes: string | null
    is_active: boolean
  }> = await request.json()

  const supabase = createServerClient()

  // Delete existing prices for this route
  const { error: deleteError } = await supabase
    .from('transfer_prices')
    .delete()
    .eq('route_id', params.id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Insert new prices (skip rows with no price set)
  const toInsert = prices
    .filter(p => p.price != null && p.price > 0)
    .map(p => ({ ...p, route_id: params.id }))

  if (toInsert.length === 0) return NextResponse.json([])

  const { data, error } = await supabase.from('transfer_prices').insert(toInsert).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
