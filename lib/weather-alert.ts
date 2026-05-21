import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'
import { getActivitySuitability, type WeatherData, type SuitabilityResult } from '@/lib/weather-suitability'

// ─── Types ─────────────────────────────────────────────────────────────────

interface TodayWeather extends WeatherData {
  weatherDesc: string
}

interface TomorrowWeather {
  temperature: number
  wind_speed: number
  precipitation_probability: number
}

interface AffectedBooking {
  confirmation_code: string
  booking_date: string
  pax: number
  guest_name: string | null
  guest_id: string | null
  item_title: string
  whatsapp_number?: string | null
}

export interface WeatherAlertResult {
  sent: boolean
  reason: string
  bookingCount: number
}

// ─── Category groups ────────────────────────────────────────────────────────

const SEA_DB_CATEGORIES      = ['on_water']
const OUTDOOR_DB_CATEGORIES  = ['on_foot', 'wild_routes', 'in_the_air']
const GENERAL_DB_CATEGORIES  = ['culinary', 'history_art', 'slow_down']

// ─── Helpers ────────────────────────────────────────────────────────────────

function wmoDesc(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2)  return 'Mainly clear'
  if (code === 3)  return 'Overcast'
  if (code <= 48) return 'Foggy'
  if (code <= 55) return 'Drizzle'
  if (code <= 65) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
}

// ─── Open-Meteo fetch ───────────────────────────────────────────────────────

async function fetchForecast(): Promise<{ today: TodayWeather; tomorrow: TomorrowWeather }> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=35.5138&longitude=24.0180' +
    '&current=temperature_2m,weather_code,wind_speed_10m' +
    '&daily=precipitation_probability_max,temperature_2m_max,wind_speed_10m_max' +
    '&forecast_days=2' +
    '&wind_speed_unit=kmh' +
    '&timezone=Europe%2FAthens'

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const json = await res.json()
  const c     = json.current
  const daily = json.daily

  return {
    today: {
      temperature:               Math.round(c.temperature_2m),
      wind_speed:                Math.round(c.wind_speed_10m),
      precipitation_probability: daily.precipitation_probability_max?.[0] ?? 0,
      weathercode:               c.weather_code,
      weatherDesc:               wmoDesc(c.weather_code),
    },
    tomorrow: {
      temperature:               Math.round(daily.temperature_2m_max?.[1] ?? 0),
      wind_speed:                Math.round(daily.wind_speed_10m_max?.[1] ?? 0),
      precipitation_probability: daily.precipitation_probability_max?.[1] ?? 0,
    },
  }
}

// ─── Email HTML builder ─────────────────────────────────────────────────────

function statusEmoji(s: SuitabilityResult): string {
  if (s.status === 'affected') return '🔴'
  if (s.status === 'check')    return '🟡'
  return '🟢'
}

function statusLabel(s: SuitabilityResult): string {
  if (s.status === 'affected') return s.reason ?? 'Adverse conditions forecast'
  if (s.status === 'check')    return s.reason ?? 'Conditions worth monitoring'
  return 'Good conditions'
}

function buildEmailHtml(
  today: TodayWeather,
  tomorrow: TomorrowWeather,
  sea: SuitabilityResult,
  outdoor: SuitabilityResult,
  general: SuitabilityResult,
  bookings: AffectedBooking[],
  todayLabel: string,
): string {
  const statBox = (icon: string, value: string, label: string) =>
    `<td style="width:25%;text-align:center;padding:12px 6px;background:#F7F6F2;border-radius:8px;">
      <div style="font-size:20px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:15px;font-weight:700;color:#1B2D4F;">${value}</div>
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.06em;">${label}</div>
    </td>`

  const categoryRow = (label: string, result: SuitabilityResult) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#1B2D4F;">
        ${statusEmoji(result)} <strong>${label}</strong>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#555;text-align:right;">
        ${statusLabel(result)}
      </td>
    </tr>`

  const bookingsSection = bookings.length > 0 ? `
    <div style="margin-top:28px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 12px;">Upcoming Bookings to Review</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#F7F6F2;">
          <th style="padding:8px 10px;text-align:left;color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Ref</th>
          <th style="padding:8px 10px;text-align:left;color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Guest</th>
          <th style="padding:8px 10px;text-align:left;color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Activity</th>
          <th style="padding:8px 10px;text-align:left;color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Date</th>
          <th style="padding:8px 10px;text-align:left;color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Contact</th>
        </tr>
        ${bookings.map(b => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px 10px;font-weight:600;color:#1B2D4F;">${b.confirmation_code ?? '—'}</td>
          <td style="padding:8px 10px;color:#333;">${b.guest_name ?? '—'} (${b.pax}p)</td>
          <td style="padding:8px 10px;color:#333;">${b.item_title}</td>
          <td style="padding:8px 10px;color:#555;">${formatDateShort(b.booking_date)}</td>
          <td style="padding:8px 10px;">
            ${b.whatsapp_number
              ? `<a href="https://wa.me/${b.whatsapp_number.replace(/\D/g, '')}" style="color:#1A8A7D;font-weight:600;text-decoration:none;">Message ${b.guest_name?.split(' ')[0] ?? 'guest'} →</a>`
              : '<span style="color:#999;">—</span>'
            }
          </td>
        </tr>`).join('')}
      </table>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Plus Jakarta Sans',Helvetica,sans-serif;background:#FDFCFA;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:#1B2D4F;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Island Key</p>
      <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:4px 0 0;text-transform:uppercase;letter-spacing:.1em;">Daily Weather Briefing</p>
    </div>

    <div style="padding:28px 32px;">

      <!-- Date -->
      <p style="font-size:14px;font-weight:600;color:#1B2D4F;margin:0 0 20px;text-transform:uppercase;letter-spacing:.06em;">${todayLabel}</p>

      <!-- Stat boxes -->
      <table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:24px;">
        <tr>
          ${statBox('🌡️', `${today.temperature}°C`, 'Temperature')}
          ${statBox('💨', `${today.wind_speed} km/h`, 'Wind Speed')}
          ${statBox('🌧️', `${today.precipitation_probability}%`, 'Rain Prob.')}
          ${statBox('☁️', today.weatherDesc, 'Conditions')}
        </tr>
      </table>

      <!-- Suitability section -->
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 8px;">Activity Suitability</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        ${categoryRow('Sea & Water Activities', sea)}
        ${categoryRow('Outdoor & Adventure', outdoor)}
        ${categoryRow('Cultural & Dining', general)}
      </table>

      ${bookingsSection}

      <!-- Tomorrow -->
      <div style="margin-top:24px;padding:14px 16px;background:#F7F6F2;border-radius:8px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 6px;">Tomorrow's Forecast</p>
        <p style="font-size:13px;color:#555;margin:0;">
          ${tomorrow.temperature}°C · ${tomorrow.wind_speed} km/h wind · ${tomorrow.precipitation_probability}% rain probability
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#F7F6F2;padding:18px 32px;border-top:1px solid #eee;">
      <p style="font-size:11px;color:#999;margin:0 0 4px;">
        This is an automated daily briefing from Island Key. Sent at 09:00 Crete time. Weather data via Open-Meteo.
      </p>
      <p style="font-size:11px;color:#bbb;margin:0;">Manage notifications: bookings@islandkey.gr</p>
    </div>

  </div>
</body>
</html>`
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function runWeatherAlert(): Promise<WeatherAlertResult> {
  const resend    = new Resend(process.env.RESEND_API_KEY)
  const supabase  = createServerClient()
  const todayIso  = new Date().toISOString().slice(0, 10)
  const todayLabel = formatDate(todayIso)

  // 1 — Fetch forecast
  const { today, tomorrow } = await fetchForecast()

  // 2 — Evaluate per group
  const sea     = getActivitySuitability('on_water',    today)
  const outdoor = getActivitySuitability('on_foot',     today)
  const general = getActivitySuitability('culinary',    today)

  // 3 — Decide whether to send
  const hasRed   = sea.status === 'affected' || outdoor.status === 'affected' || general.status === 'affected'
  const windAlert = today.wind_speed > 25

  if (!hasRed && !(windAlert)) {
    // Check if any amber + sea booking exists for wind alert condition
    const hasAmber = sea.status === 'check' || outdoor.status === 'check' || general.status === 'check'
    if (!hasAmber) {
      return { sent: false, reason: 'All conditions green — no alert needed', bookingCount: 0 }
    }
  }

  // 4 — Collect affected DB categories
  const affectedCategories: string[] = []
  if (sea.status !== 'good')     affectedCategories.push(...SEA_DB_CATEGORIES)
  if (outdoor.status !== 'good') affectedCategories.push(...OUTDOOR_DB_CATEGORIES)
  if (general.status !== 'good') affectedCategories.push(...GENERAL_DB_CATEGORIES)

  // 5 — Query affected activities
  let affectedActivityIds: string[] = []

  if (affectedCategories.length > 0 || (sea.status !== 'good')) {
    let actQuery = supabase
      .from('activities')
      .select('id, title, category, is_boat_activity')
      .eq('is_active', true)

    if (affectedCategories.length > 0) {
      // Also include boat activities when sea is affected
      const seaAffected = sea.status !== 'good'
      if (seaAffected) {
        actQuery = actQuery.or(
          `category.in.(${affectedCategories.join(',')}),is_boat_activity.eq.true`
        )
      } else {
        actQuery = actQuery.in('category', affectedCategories)
      }
    } else if (sea.status !== 'good') {
      actQuery = actQuery.eq('is_boat_activity', true)
    }

    const { data: activities } = await actQuery
    affectedActivityIds = (activities ?? []).map((a: { id: string }) => a.id)
  }

  // 6 — Query upcoming bookings in affected activities
  let bookings: AffectedBooking[] = []

  if (affectedActivityIds.length > 0) {
    const twoDaysOut = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10)

    const { data: rawBookings } = await supabase
      .from('bookings')
      .select('id, confirmation_code, booking_date, pax, guest_id, guest_name, item_title')
      .eq('item_type', 'activity')
      .in('status', ['pending', 'confirmed'])
      .gte('booking_date', todayIso)
      .lte('booking_date', twoDaysOut)
      .in('item_id', affectedActivityIds)
      .order('booking_date', { ascending: true })
      .limit(20)

    if (rawBookings && rawBookings.length > 0) {
      // Fetch WhatsApp numbers from guests
      const guestIds = Array.from(new Set(
        rawBookings.map((b: { guest_id: string | null }) => b.guest_id).filter(Boolean)
      )) as string[]

      const whatsappMap: Record<string, string | null> = {}

      if (guestIds.length > 0) {
        const { data: guests } = await supabase
          .from('guests')
          .select('id, whatsapp_number')
          .in('id', guestIds)

        for (const g of (guests ?? [])) {
          whatsappMap[g.id] = g.whatsapp_number
        }
      }

      bookings = rawBookings.map((b: {
        confirmation_code: string; booking_date: string; pax: number;
        guest_name: string | null; guest_id: string | null; item_title: string
      }) => ({
        ...b,
        whatsapp_number: b.guest_id ? (whatsappMap[b.guest_id] ?? null) : null,
      }))
    }
  }

  // 7 — Final send gate: if only amber with no bookings, skip
  if (!hasRed && bookings.length === 0) {
    return { sent: false, reason: 'Amber conditions but no upcoming affected bookings', bookingCount: 0 }
  }

  // 8 — Build subject
  const mostSevereReason =
    sea.status === 'affected'     ? sea.reason :
    outdoor.status === 'affected' ? outdoor.reason :
    general.status === 'affected' ? general.reason :
    sea.status === 'check'        ? sea.reason :
    outdoor.status === 'check'    ? outdoor.reason :
    general.reason

  const subject = hasRed
    ? `🔴 Weather Alert — ${mostSevereReason} in Chania today`
    : `🟡 Weather Check — Conditions worth monitoring in Chania`

  // 9 — Send email
  const html = buildEmailHtml(today, tomorrow, sea, outdoor, general, bookings, todayLabel)

  const { error } = await resend.emails.send({
    from:    'bookings@islandkey.gr',
    to:      'bookings@islandkey.gr',
    subject,
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)

  return { sent: true, reason: subject, bookingCount: bookings.length }
}
