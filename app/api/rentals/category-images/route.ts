import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rental_category_images')
    .select('category, image_url, image_wide')
  if (error) return NextResponse.json({}, { status: 500 })
  const result: Record<string, string | null> = {}
  for (const row of data ?? []) {
    result[row.category] = row.image_wide ?? row.image_url ?? null
  }
  return NextResponse.json(result)
}
