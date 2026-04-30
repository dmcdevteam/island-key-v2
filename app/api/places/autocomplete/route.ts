import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')?.trim() ?? ''
  if (input.length < 2) return NextResponse.json([])

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 500 })

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.set('input', input)
  url.searchParams.set('key', key)
  url.searchParams.set('components', 'country:gr')
  url.searchParams.set('location', '35.3,25.1')
  url.searchParams.set('radius', '200000')
  url.searchParams.set('language', 'en')

  const res  = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('[places/autocomplete]', data.status, data.error_message)
    return NextResponse.json({ error: data.status }, { status: 502 })
  }

  const predictions = (data.predictions ?? []).map((p: {
    place_id: string
    description: string
    types: string[]
  }) => ({
    place_id:    p.place_id,
    description: p.description,
    types:       p.types ?? [],
  }))

  return NextResponse.json(predictions)
}
