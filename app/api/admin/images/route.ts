import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

const BUCKET = 'activity-images'

// ── GET — list all folders in storage + activities for matching ──────────────
export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // List top-level items in bucket (folders have id === null)
  const { data: topLevel, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const folderNames = (topLevel ?? [])
    .filter(item => item.id === null)
    .map(item => item.name)

  // For each folder, list files and build public URLs
  const folders = await Promise.all(
    folderNames.map(async (folderName) => {
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(folderName, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

      const imageFiles = (files ?? []).filter(f => f.id !== null)
      const urls = imageFiles.map(f =>
        supabase.storage.from(BUCKET).getPublicUrl(`${folderName}/${f.name}`).data.publicUrl
      )
      return {
        name: folderName,
        urls,
        fileNames: imageFiles.map(f => f.name),
        storagePaths: imageFiles.map(f => `${folderName}/${f.name}`),
      }
    })
  )

  // Fetch all activities for matching
  const { data: activities, error: actErr } = await supabase
    .from('activities')
    .select('id, slug, title, category, images, image_alts')
    .order('sort_order', { ascending: true })

  if (actErr) return NextResponse.json({ error: actErr.message }, { status: 500 })

  return NextResponse.json({ folders, activities })
}

// ── DELETE — remove a file or an entire folder from storage ─────────────────
export async function DELETE(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { path, folder } = body as { path?: string; folder?: string }
  const supabase = createServerClient()

  if (folder) {
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 1000 })
    const paths = (files ?? [])
      .filter(f => f.id !== null)
      .map(f => `${folder}/${f.name}`)
    if (paths.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (path) {
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide path or folder' }, { status: 400 })
}
