import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .lte('published_at', now)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
