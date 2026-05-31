import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../../_lib/auth'

const BUCKET = 'activity-images'

// POST — sync Storage → DB: for every folder whose name matches an activity slug,
// rebuild that activity's images array from the actual files in the bucket.
// Existing image_alts are preserved where the URL is still present; new files get ''.
export async function POST() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // 1. Get all top-level folders in the bucket
  const { data: topLevel, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const folderNames = (topLevel ?? [])
    .filter(item => item.id === null)
    .map(item => item.name)

  // 2. Fetch all activities
  const { data: activities, error: actErr } = await supabase
    .from('activities')
    .select('id, slug, images, image_alts')

  if (actErr) return NextResponse.json({ error: actErr.message }, { status: 500 })

  const activityBySlug = Object.fromEntries((activities ?? []).map(a => [a.slug, a]))

  const results: { slug: string; count: number; status: 'updated' | 'no_match' | 'empty' }[] = []

  // 3. For each folder, build URLs and update the matching activity
  await Promise.all(
    folderNames.map(async (folderName) => {
      const activity = activityBySlug[folderName]
      if (!activity) {
        results.push({ slug: folderName, count: 0, status: 'no_match' })
        return
      }

      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(folderName, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

      const imageFiles = (files ?? []).filter(f => f.id !== null)
      if (imageFiles.length === 0) {
        results.push({ slug: folderName, count: 0, status: 'empty' })
        return
      }

      const storageUrls = imageFiles.map(f =>
        supabase.storage.from(BUCKET).getPublicUrl(`${folderName}/${f.name}`).data.publicUrl
      )

      // Preserve existing alts for URLs that are staying; blank for new ones
      const existingUrls: string[] = activity.images ?? []
      const existingAlts: string[] = activity.image_alts ?? []
      const altByUrl = Object.fromEntries(existingUrls.map((u, i) => [u, existingAlts[i] ?? '']))
      const newAlts = storageUrls.map(u => altByUrl[u] ?? '')

      await supabase
        .from('activities')
        .update({ images: storageUrls, image_alts: newAlts })
        .eq('id', activity.id)

      results.push({ slug: folderName, count: storageUrls.length, status: 'updated' })
    })
  )

  const updated = results.filter(r => r.status === 'updated')
  const noMatch = results.filter(r => r.status === 'no_match')

  return NextResponse.json({
    ok: true,
    updated: updated.length,
    details: results,
    noMatch: noMatch.map(r => r.slug),
  })
}
