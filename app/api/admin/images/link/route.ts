import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../../_lib/auth'

// PATCH — append uploaded URLs to an activity's images/image_alts arrays
export async function PATCH(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { activityId, urls, alts } = body as {
    activityId: string
    urls: string[]
    alts: string[]
  }

  if (!activityId || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Fetch current arrays
  const { data: activity, error: fetchErr } = await supabase
    .from('activities')
    .select('images, image_alts')
    .eq('id', activityId)
    .single()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const existingUrls: string[] = activity.images ?? []
  const existingAlts: string[] = activity.image_alts ?? []

  // Deduplicate by URL
  const toAdd = urls.filter(u => !existingUrls.includes(u))
  const toAddAlts = toAdd.map((_, i) => alts?.[i] ?? '')

  const { error: updateErr } = await supabase
    .from('activities')
    .update({
      images:     [...existingUrls, ...toAdd],
      image_alts: [...existingAlts, ...toAddAlts],
    })
    .eq('id', activityId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, added: toAdd.length, skipped: urls.length - toAdd.length })
}
