import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('place_id')?.trim()
  if (!placeId) return NextResponse.json({ error: 'Missing place_id' }, { status: 400 })

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 500 })

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'place_id,name,formatted_address,geometry,types')
  url.searchParams.set('key', key)
  url.searchParams.set('language', 'en')

  const res  = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json()

  if (data.status !== 'OK') {
    console.error('[places/details]', data.status, data.error_message)
    return NextResponse.json({ error: data.status }, { status: 502 })
  }

  const r = data.result
  return NextResponse.json({
    place_id: r.place_id,
    name:     r.name,
    address:  r.formatted_address,
    lat:      r.geometry?.location?.lat ?? null,
    lng:      r.geometry?.location?.lng ?? null,
    types:    r.types ?? [],
  })
}
