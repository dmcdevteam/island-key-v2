import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .in('type', ['transfer', 'multi'])
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('providers')
    .insert({
      name:          body.name,
      type:          'transfer',
      contact_name:  body.contact_name  ?? null,
      contact_phone: body.contact_phone ?? null,
      whatsapp:      body.whatsapp      ?? null,
      email:         body.email         ?? null,
      region:        body.base_region   ?? 'island-wide',
      base_region:   body.base_region   ?? null,
      fleet:         body.fleet         ?? {},
      notes:         body.notes         ?? null,
      is_active:     body.is_active     ?? true,
      commission_rate: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
