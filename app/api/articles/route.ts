import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const category = searchParams.get('category')

  const supabase = createServerClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'all') query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
