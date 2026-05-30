import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { SmartCard } from '@/lib/types'

interface WeatherSnapshot {
  temperature: number
  wind_speed: number
  precipitation_probability: number
}

async function fetchWeather(): Promise<WeatherSnapshot | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=35.5138&longitude=24.0180' +
      '&current=temperature_2m,wind_speed_10m' +
      '&daily=precipitation_probability_max' +
      '&forecast_days=1' +
      '&wind_speed_unit=kmh' +
      '&timezone=Europe%2FAthens',
      { next: { revalidate: 1800 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    return {
      temperature: Math.round(json.current.temperature_2m),
      wind_speed: Math.round(json.current.wind_speed_10m),
      precipitation_probability: json.daily?.precipitation_probability_max?.[0] ?? 0,
    }
  } catch {
    return null
  }
}

function cardPassesWeatherFilter(
  trigger: SmartCard['trigger_type'],
  weather: WeatherSnapshot | null,
): boolean {
  if (trigger === 'manual' || trigger === 'time_window') return true
  if (!weather) return false
  switch (trigger) {
    case 'weather_hot':   return weather.temperature > 30
    case 'weather_windy': return weather.wind_speed > 25
    case 'weather_rainy': return weather.precipitation_probability > 60
    case 'weather_clear':
      return weather.temperature <= 30 &&
             weather.wind_speed <= 25 &&
             weather.precipitation_probability <= 40
    default: return false
  }
}

export async function GET() {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('smart_cards')
    .select('*')
    .eq('is_active', true)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ cards: [], weather: null })

  const weather = await fetchWeather()
  const cards = (data as SmartCard[]).filter(c =>
    cardPassesWeatherFilter(c.trigger_type, weather),
  )

  return NextResponse.json({ cards, weather })
}
