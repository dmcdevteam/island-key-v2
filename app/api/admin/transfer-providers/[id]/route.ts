import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('providers')
    .update({
      name:          body.name,
      contact_name:  body.contact_name  ?? null,
      contact_phone: body.contact_phone ?? null,
      whatsapp:      body.whatsapp      ?? null,
      email:         body.email         ?? null,
      base_region:   body.base_region   ?? null,
      region:        body.base_region   ?? 'island-wide',
      fleet:         body.fleet         ?? {},
      notes:         body.notes         ?? null,
      is_active:     body.is_active     ?? true,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { error } = await supabase.from('providers').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
