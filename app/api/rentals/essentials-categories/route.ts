import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rental_essentials_categories')
    .select('*')
    .order('sort_order')
  if (error) return NextResponse.json({ categories: [] }, { status: 500 })
  return NextResponse.json({ categories: data ?? [] })
}
