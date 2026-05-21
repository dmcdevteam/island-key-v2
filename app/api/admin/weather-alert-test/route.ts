import { NextResponse } from 'next/server'
import { isAdminAuthed } from '../_lib/auth'
import { runWeatherAlert } from '@/lib/weather-alert'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'

  try {
    const result = await runWeatherAlert(force)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[weather-alert-test]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
