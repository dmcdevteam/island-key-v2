import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../admin/_lib/auth'

export const maxDuration = 60

const ALLOWED_BUCKETS = new Set([
  'activity-images', 'rental-images', 'transfer-images',
  'deal-images', 'event-images', 'article-images',
])

function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (buf.length >= 12 && buf.slice(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.slice(8, 12).toString('ascii')
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
    return null // HEIC/MP4/MOV blocked
  }
  return null
}

// POST /api/upload
// FormData: file, bucket, slug (optional)
// Returns: { wide: url, square: url }
export async function POST(request: Request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: globalThis.FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const slug        = (formData.get('slug')   as string | null)?.trim() || null
  const bucketParam = (formData.get('bucket') as string | null)?.trim() || 'activity-images'
  const BUCKET      = ALLOWED_BUCKETS.has(bucketParam) ? bucketParam : 'activity-images'

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }

  const detectedMime = detectMimeFromBuffer(buffer)
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
  if (!detectedMime || !allowed.has(detectedMime)) {
    return NextResponse.json(
      { error: `Unsupported format. Upload JPG, PNG, WebP, or AVIF.` },
      { status: 422 }
    )
  }

  // ── Generate variants with Sharp ────────────────────────────────────────────
  const prefix = slug ? `${slug}/` : ''
  const ts = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  let wideBuffer: Buffer
  let squareBuffer: Buffer
  try {
    const src = sharp(buffer)

    wideBuffer = await src
      .clone()
      .resize(1200, 675, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer()

    squareBuffer = await src
      .clone()
      .resize(600, 600, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer()
  } catch (err) {
    console.error('[upload] Sharp error:', err)
    return NextResponse.json({ error: 'Image processing failed' }, { status: 500 })
  }

  const supabase = createServerClient()

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.id === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/*'],
    })
  }

  async function upload(buf: Buffer, suffix: string): Promise<string> {
    const path = `${prefix}${ts}-${suffix}.webp`
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: 'image/webp', upsert: false })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    return publicUrl
  }

  try {
    const [wide, square] = await Promise.all([
      upload(wideBuffer,   'wide'),
      upload(squareBuffer, 'sq'),
    ])
    return NextResponse.json({ wide, square })
  } catch (err) {
    console.error('[upload] Storage error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
