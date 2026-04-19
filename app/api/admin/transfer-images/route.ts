import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

const BUCKET = 'transfer-images'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()

  const { data: topLevel, error: listErr } = await supabase.storage
    .from(BUCKET).list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const folderNames = (topLevel ?? []).filter(item => item.id === null).map(item => item.name)

  const folders = await Promise.all(
    folderNames.map(async (folderName) => {
      const { data: files } = await supabase.storage
        .from(BUCKET).list(folderName, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
      const imageFiles = (files ?? []).filter(f => f.id !== null)
      const urls = imageFiles.map(f =>
        supabase.storage.from(BUCKET).getPublicUrl(`${folderName}/${f.name}`).data.publicUrl
      )
      return { name: folderName, urls, fileNames: imageFiles.map(f => f.name), storagePaths: imageFiles.map(f => `${folderName}/${f.name}`) }
    })
  )

  const { data: routes, error: routeErr } = await supabase
    .from('transfer_routes').select('id, from_location, to_location, image').order('sort_order', { ascending: true })
  if (routeErr) return NextResponse.json({ error: routeErr.message }, { status: 500 })

  return NextResponse.json({ folders, routes })
}

export async function DELETE(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { path, folder } = body as { path?: string; folder?: string }
  const supabase = createServerClient()

  if (folder) {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 })
    const paths = (files ?? []).filter(f => f.id !== null).map(f => `${folder}/${f.name}`)
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
