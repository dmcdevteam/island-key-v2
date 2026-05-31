import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category    = searchParams.get('category')
  const subcategory = searchParams.get('subcategory')
  const mood        = searchParams.get('mood')
  const featured    = searchParams.get('featured') === 'true'

  const supabase = createServerClient()
  let query = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .eq('region', 'chania')
    .order('sort_order')
    .order('title')

  if (category)    query = query.eq('category', category)
  if (subcategory) query = query.eq('subcategory', subcategory)
  if (featured)    query = query.eq('is_featured', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let services = data ?? []
  if (mood) services = services.filter((s: { mood_tags?: string[] }) => s.mood_tags?.includes(mood))

  return NextResponse.json({ services })
}
