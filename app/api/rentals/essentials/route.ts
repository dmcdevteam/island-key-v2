import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rental_extras')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) return NextResponse.json({ essentials: [] }, { status: 500 })
  return NextResponse.json({ essentials: data ?? [] })
}
