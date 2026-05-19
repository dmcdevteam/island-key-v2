import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

const BUCKET = 'service-images'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()

  const { data: topLevel, error: listErr } = await supabase.storage
    .from(BUCKET).list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (listErr) {
    return NextResponse.json({ folders: [] })
  }

  const folderNames = (topLevel ?? []).filter(item => item.id === null).map(item => item.name)
  const rootFiles = (topLevel ?? []).filter(item => item.id !== null)

  const folders = await Promise.all(
    folderNames.map(async (folderName) => {
      const { data: files } = await supabase.storage
        .from(BUCKET).list(folderName, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
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

  // Include root-level files as a synthetic folder
  if (rootFiles.length > 0) {
    const urls = rootFiles.map(f =>
      supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl
    )
    folders.unshift({
      name: '.',
      urls,
      fileNames: rootFiles.map(f => f.name),
      storagePaths: rootFiles.map(f => f.name),
    })
  }

  return NextResponse.json({ folders })
}
