import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('notifications')
    .update({
      title:              body.title,
      body:               body.body,
      type:               body.type,
      target:             body.target,
      target_property_id: body.target_property_id || null,
      target_guest_id:    body.target_guest_id    || null,
      scheduled_at:       body.scheduled_at,
      is_active:          body.is_active,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
