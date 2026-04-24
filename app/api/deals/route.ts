import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tier = searchParams.get('tier')
  const region = searchParams.get('region')
  const propertyId = searchParams.get('property_id')
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const supabase = createServerClient()
  let query = supabase
    .from('deals')
    .select('*')
    .eq('is_active', true)
    .lte('valid_from', new Date().toISOString())
    .order('sort_order')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (featured) query = query.eq('is_featured', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let deals = data ?? []

  // Filter by valid_until (not expired)
  const now = new Date()
  deals = deals.filter(d => !d.valid_until || new Date(d.valid_until) > now)

  // Filter by tier
  if (tier) {
    deals = deals.filter(d => !d.tier_visibility?.length || d.tier_visibility.includes(tier))
  }

  // Filter by region
  if (region) {
    deals = deals.filter(d => d.region === region || d.region === 'island-wide')
  }

  // Property-exclusive deal filtering
  if (propertyId) {
    deals = deals.filter(d => !d.property_id || d.property_id === propertyId)
  } else {
    // If no property session, only show non-exclusive deals
    deals = deals.filter(d => !d.property_id)
  }

  return NextResponse.json(deals)
}
