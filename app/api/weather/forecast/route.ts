import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 1800 // 30-minute server cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') ?? '35.5138'
  const lng = searchParams.get('lng') ?? '24.0180'

  try {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}` +
      `&longitude=${lng}` +
      '&current=temperature_2m,weather_code,wind_speed_10m' +
      '&daily=precipitation_probability_max' +
      '&forecast_days=1' +
      '&wind_speed_unit=kmh' +
      '&timezone=Europe%2FAthens'

    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)

    const json = await res.json()
    const c    = json.current
    const precip = json.daily?.precipitation_probability_max?.[0] ?? 0

    return NextResponse.json({
      temperature:                c.temperature_2m,
      wind_speed:                 c.wind_speed_10m,
      precipitation_probability:  precip,
      weathercode:                c.weather_code,
      cached_at:                  new Date().toISOString(),
    })
  } catch (err) {
    console.error('[weather/forecast]', err)
    return NextResponse.json(
      { error: 'Weather unavailable' },
      { status: 503 }
    )
  }
}
