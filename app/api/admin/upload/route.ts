import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

const BUCKET = 'activity-images'

// Increase Vercel serverless body limit for image uploads
export const maxDuration = 30

function guessMimeType(filename: string, declared: string): string {
  if (declared && declared !== 'application/octet-stream') return declared
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', avif: 'image/avif',
    heic: 'image/heic', heif: 'image/heif',
  }
  return map[ext ?? ''] ?? 'image/jpeg'
}

export async function POST(request: Request) {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    if (!await isAdminAuthed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    let formData: globalThis.FormData
    try {
      formData = await request.formData()
    } catch (e) {
      console.error('[upload] Failed to parse form data:', e)
      return NextResponse.json({ error: 'Invalid form data — check Content-Type header' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided or file is empty' }, { status: 400 })
    }

    // ── Optional SEO metadata params ──────────────────────────────────────────
    const slug        = (formData.get('slug')        as string | null)?.trim() || null
    const alt         = (formData.get('alt')         as string | null)?.trim() || null
    const title       = (formData.get('title')       as string | null)?.trim() || null
    const description = (formData.get('description') as string | null)?.trim() || null

    const contentType = guessMimeType(file.name, file.type)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const basename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    // Organise into a folder per activity slug if provided
    const filename = slug ? `${slug}/${basename}` : basename

    // ── Read file buffer ──────────────────────────────────────────────────────
    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch (e) {
      console.error('[upload] Failed to read file buffer:', e)
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
    }

    console.log(`[upload] Uploading ${filename} (${buffer.length} bytes, ${contentType})`)

    const supabase = createServerClient()

    // ── Ensure bucket exists ──────────────────────────────────────────────────
    const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets()
    if (bucketsErr) {
      console.error('[upload] Failed to list buckets:', bucketsErr)
      return NextResponse.json({ error: `Storage error: ${bucketsErr.message}` }, { status: 500 })
    }

    const bucketExists = buckets.some(b => b.id === BUCKET)
    if (!bucketExists) {
      console.log(`[upload] Bucket "${BUCKET}" not found, creating...`)
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10 MB
        allowedMimeTypes: ['image/*'],
      })
      if (createErr) {
        console.error('[upload] Failed to create bucket:', createErr)
        return NextResponse.json({ error: `Could not create storage bucket: ${createErr.message}` }, { status: 500 })
      }
      console.log(`[upload] Bucket "${BUCKET}" created successfully`)
    }

    // ── Upload with SEO metadata ──────────────────────────────────────────────
    const metadata: Record<string, string> = {}
    if (alt)         metadata['x-alt']         = alt
    if (title)       metadata['x-title']       = title
    if (description) metadata['x-description'] = description

    const { data, error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
        upsert: false,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })

    if (uploadErr) {
      console.error('[upload] Supabase upload error:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    console.log(`[upload] Success: ${publicUrl}`)

    return NextResponse.json({ url: publicUrl, alt: alt ?? '' })

  } catch (err) {
    // Catch-all so the route always returns JSON (never HTML error pages)
    console.error('[upload] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}
