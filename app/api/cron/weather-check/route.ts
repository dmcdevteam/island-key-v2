import { NextRequest } from 'next/server'
import { runWeatherAlert } from '@/lib/weather-alert'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeatherAlert()
    console.log('[weather-check cron]', result)
    return Response.json(result)
  } catch (err) {
    console.error('[weather-check cron] error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
