import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id           = searchParams.get('id')
  const car_class    = searchParams.get('car_class')
  const zero_deposit = searchParams.get('zero_deposit')
  const transmission = searchParams.get('transmission')
  const fuel_type    = searchParams.get('fuel_type')
  const seats        = searchParams.get('seats')

  const supabase = createServerClient()

  let query = supabase
    .from('rentals')
    .select('*')
    .eq('type', 'car')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('price_per_day', { ascending: true })

  if (id)           query = query.eq('id', id)
  if (car_class)    query = query.eq('car_class', car_class)
  if (zero_deposit === 'true') query = query.eq('zero_deposit', true)
  if (transmission) query = query.eq('transmission', transmission)
  if (fuel_type)    query = query.eq('fuel_type', fuel_type)
  if (seats)        query = query.gte('seats', parseInt(seats))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (id) {
    const rental = data?.[0] ?? null
    if (!rental) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ rental })
  }

  return NextResponse.json({ rentals: data ?? [] })
}
