import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../_lib/auth'

export const maxDuration = 30

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data, error } = await supabase.from('events').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

/** Crop image buffer centered on focal point (0–1 coords) to targetW×targetH, output WebP */
async function cropWithFocalPoint(
  buffer: Buffer,
  focalX: number,
  focalY: number,
  targetW: number,
  targetH: number,
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const srcW = meta.width ?? targetW
  const srcH = meta.height ?? targetH
  const targetRatio = targetW / targetH
  const srcRatio = srcW / srcH

  let cropW: number, cropH: number, cropX: number, cropY: number

  if (srcRatio > targetRatio) {
    // Image wider than target — crop horizontally
    cropH = srcH
    cropW = Math.round(srcH * targetRatio)
    cropX = Math.max(0, Math.min(Math.round(focalX * srcW - cropW / 2), srcW - cropW))
    cropY = 0
  } else {
    // Image taller than target — crop vertically
    cropW = srcW
    cropH = Math.round(srcW / targetRatio)
    cropX = 0
    cropY = Math.max(0, Math.min(Math.round(focalY * srcH - cropH / 2), srcH - cropH))
  }

  return sharp(buffer)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .resize(targetW, targetH)
    .webp({ quality: 85 })
    .toBuffer()
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const supabase = createServerClient()

  // Read current event to detect focal point / image changes
  const { data: current } = await supabase
    .from('events')
    .select('focal_x, focal_y, images, image_wide, image_square')
    .eq('id', params.id)
    .single()

  const newFx: number | null = typeof body.focal_x === 'number' ? body.focal_x : null
  const newFy: number | null = typeof body.focal_y === 'number' ? body.focal_y : null
  // Raw image source: prefer newly uploaded images[0] from body, fall back to existing
  const rawImageUrl: string | null = body.images?.[0] ?? current?.images?.[0] ?? null

  let updatedBody = { ...body }

  if (newFx != null && newFy != null && rawImageUrl) {
    const focalChanged = current?.focal_x !== newFx || current?.focal_y !== newFy
    const imageChanged = current?.images?.[0] !== rawImageUrl

    if (focalChanged || imageChanged) {
      try {
        const imgRes = await fetch(rawImageUrl)
        if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.status}`)
        const buffer = Buffer.from(await imgRes.arrayBuffer())

        const [wideBuffer, squareBuffer] = await Promise.all([
          cropWithFocalPoint(buffer, newFx, newFy, 1200, 675),
          cropWithFocalPoint(buffer, newFx, newFy, 600, 600),
        ])

        const ts = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const prefix = `${params.id}/`

        const uploadCrop = async (buf: Buffer, suffix: string): Promise<string> => {
          const path = `${prefix}${ts}-${suffix}.webp`
          const { data, error } = await supabase.storage
            .from('event-images')
            .upload(path, buf, { contentType: 'image/webp', upsert: true })
          if (error) throw new Error(error.message)
          const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path)
          return publicUrl
        }

        const [wideUrl, squareUrl] = await Promise.all([
          uploadCrop(wideBuffer, 'wide'),
          uploadCrop(squareBuffer, 'sq'),
        ])

        updatedBody = { ...updatedBody, image_wide: wideUrl, image_square: squareUrl }
      } catch (err) {
        console.error('[events PUT] Re-crop failed, clearing image_wide/image_square:', err)
        // Clear stale crops so fallback to object-contain kicks in
        updatedBody = { ...updatedBody, image_wide: null, image_square: null }
      }
    }
  } else if (newFx == null || newFy == null) {
    // Focal point removed — clear processed crops
    updatedBody = { ...updatedBody, image_wide: null, image_square: null }
  }

  const { data, error } = await supabase
    .from('events')
    .update(updatedBody)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { error } = await supabase.from('events').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
