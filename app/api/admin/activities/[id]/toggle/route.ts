import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../../../_lib/auth'

// PATCH: toggle a boolean field on an activity
// Body: { field: 'is_active' | 'is_featured', value: boolean }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { field, value } = await request.json()

  if (!['is_active', 'is_featured'].includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('activities')
    .update({ [field]: value })
    .eq('id', params.id)
    .select('id, is_active, is_featured')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
