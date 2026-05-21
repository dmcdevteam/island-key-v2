import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('guests')
    .update(body as never)
    .eq('id', params.id)
    .select('id')
    .single()

  if (error) {
    console.error('guests patch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: (data as { id: string }).id })
}
