import { NextResponse } from 'next/server'
import { isAdminAuthed } from '../_lib/auth'
import { runWeatherAlert } from '@/lib/weather-alert'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeatherAlert()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[weather-alert-test]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
