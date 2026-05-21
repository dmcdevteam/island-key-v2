export type Suitability = 'good' | 'check' | 'affected'

export interface WeatherData {
  temperature:                number
  wind_speed:                 number
  precipitation_probability:  number
  weathercode:                number
}

export interface SuitabilityResult {
  status: Suitability
  reason: string | null
}

// Categories that map to SEA rules
const SEA_CATEGORIES = new Set([
  'on_water', 'water', 'boat', 'boat_trips', 'sailing', 'snorkelling', 'diving',
  'kayak', 'surf', 'catamaran', 'sea', 'swimming',
])

// Categories that map to OUTDOOR rules
const OUTDOOR_CATEGORIES = new Set([
  'on_foot', 'wild_routes', 'in_the_air',
  'hiking', 'cycling', 'adventure', 'trekking', 'outdoor', 'walking', 'climbing',
])

export function getActivitySuitability(
  category: string,
  weather: WeatherData,
  isBoatActivity?: boolean,
): SuitabilityResult {
  const cat = category.toLowerCase()

  const isSea     = isBoatActivity === true || SEA_CATEGORIES.has(cat)
  const isOutdoor = !isSea && OUTDOOR_CATEGORIES.has(cat)

  if (isSea) {
    if (
      weather.wind_speed > 35 ||
      weather.precipitation_probability > 70 ||
      weather.weathercode >= 80
    ) {
      return { status: 'affected', reason: 'Strong winds forecast today' }
    }
    if (weather.wind_speed > 25 || weather.precipitation_probability > 50) {
      return { status: 'check', reason: 'Moderate winds — check before you go' }
    }
    return { status: 'good', reason: null }
  }

  if (isOutdoor) {
    if (weather.temperature > 40 || weather.weathercode >= 80) {
      return { status: 'affected', reason: 'Extreme heat or rain forecast' }
    }
    if (weather.temperature > 37 || weather.precipitation_probability > 60) {
      return { status: 'check', reason: 'High temperatures today' }
    }
    return { status: 'good', reason: null }
  }

  // All other categories (culinary, history_art, slow_down, etc.)
  if (weather.weathercode >= 80) {
    return { status: 'affected', reason: 'Stormy conditions forecast' }
  }
  if (weather.precipitation_probability > 70) {
    return { status: 'check', reason: 'Rain possible today' }
  }
  return { status: 'good', reason: null }
}
