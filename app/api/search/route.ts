import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({
      results: { activities: [], services: [], rentals: [], events: [] },
      total: 0,
      query: q,
    })
  }

  const supabase = createServerClient()
  const p = `%${q}%`

  const [actRes, svcRes, rentalRes, evtRes] = await Promise.all([
    supabase
      .from('activities')
      .select('id, title, description, category, price_from, image_square, slug, item_type')
      .eq('is_active', true)
      .eq('item_type', 'activity')
      .or(`title.ilike.${p},description.ilike.${p},category.ilike.${p}`)
      .limit(5),
    supabase
      .from('services')
      .select('id, title, short_description, subcategory, service_type, price_from, image_square, slug, category')
      .eq('is_active', true)
      .or(`title.ilike.${p},short_description.ilike.${p},subcategory.ilike.${p},service_type.ilike.${p}`)
      .limit(5),
    supabase
      .from('rentals')
      .select('id, name, description, type, car_class, price_per_day, image_square')
      .eq('is_active', true)
      .or(`name.ilike.${p},description.ilike.${p},type.ilike.${p},car_class.ilike.${p}`)
      .limit(5),
    supabase
      .from('events')
      .select('id, title, description, category, image_square, slug, price_from, is_free')
      .eq('is_active', true)
      .or(`title.ilike.${p},description.ilike.${p},category.ilike.${p}`)
      .limit(5),
  ])

  const activities = actRes.data ?? []
  const services   = svcRes.data   ?? []
  const rentals    = rentalRes.data ?? []
  const events     = evtRes.data    ?? []
  const total      = activities.length + services.length + rentals.length + events.length

  return NextResponse.json({ results: { activities, services, rentals, events }, total, query: q })
}
