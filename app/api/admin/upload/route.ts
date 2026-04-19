import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

const BUCKET = 'activity-images'

// Increase Vercel serverless body limit for image uploads
export const maxDuration = 30

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Detect real format from magic bytes — more reliable than declared MIME or extension */
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  // AVIF / HEIC / MP4 container family all start with 'ftyp' at byte offset 4
  if (buf.length >= 8 && buf.slice(4, 8).toString('ascii') === 'ftyp') return 'image/avif-family'
  return null
}

function guessMimeType(filename: string, declared: string): string {
  if (declared && declared !== 'application/octet-stream') return declared
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
  }
  return map[ext ?? ''] ?? 'application/octet-stream'
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

    // ── Read file buffer ──────────────────────────────────────────────────────
    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch (e) {
      console.error('[upload] Failed to read file buffer:', e)
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
    }

    // ── Format validation (magic bytes first, then declared MIME, then extension) ──
    const detectedMime = detectMimeFromBuffer(buffer)
    let effectiveMime: string

    if (detectedMime !== null) {
      // Magic bytes are authoritative — trust them regardless of declared type or extension
      effectiveMime = detectedMime
    } else {
      // Fallback: declared MIME or extension guess
      effectiveMime = guessMimeType(file.name, file.type)
    }

    if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
      const ext = file.name.split('.').pop()?.toUpperCase() ?? 'unknown'
      const detected = detectedMime ? ` (detected: ${detectedMime})` : ''
      return NextResponse.json(
        {
          error: `${file.name} — ${ext} format is not supported${detected}. Please convert to JPG or WebP before uploading.`,
          rejected: true,
        },
        { status: 422 }
      )
    }

    const contentType = effectiveMime
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const basename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filename = slug ? `${slug}/${basename}` : basename

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
    console.error('[upload] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}
