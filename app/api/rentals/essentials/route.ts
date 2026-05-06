import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const supabase = createServerClient()
  let query = supabase
    .from('rental_extras')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) return NextResponse.json({ essentials: [] }, { status: 500 })
  return NextResponse.json({ essentials: data ?? [] })
}
