import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('total_redemptions')
    .eq('id', params.id)
    .single()

  if (fetchError || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const { error } = await supabase
    .from('deals')
    .update({ total_redemptions: (deal.total_redemptions ?? 0) + 1 })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
