import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('info_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
