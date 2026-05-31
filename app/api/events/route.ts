import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Expand a recurring event into instances within [from, to] date range
function expandRecurring(event: Record<string, unknown>, fromDate: Date, toDate: Date): Record<string, unknown>[] {
  const instances: Record<string, unknown>[] = []
  const start = new Date(event.start_date as string)
  const pattern = event.recurring_pattern as string

  let cursor = new Date(start)

  while (cursor <= toDate) {
    if (cursor >= fromDate) {
      const offsetMs = cursor.getTime() - start.getTime()
      instances.push({
        ...event,
        start_date: cursor.toISOString(),
        end_date: event.end_date
          ? new Date(new Date(event.end_date as string).getTime() + offsetMs).toISOString()
          : null,
        _instance_date: cursor.toISOString().slice(0, 10),
      })
    }
    if (pattern === 'weekly') {
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (pattern === 'monthly') {
      cursor = new Date(cursor)
      cursor.setMonth(cursor.getMonth() + 1)
    } else if (pattern === 'annual') {
      cursor = new Date(cursor)
      cursor.setFullYear(cursor.getFullYear() + 1)
    } else {
      break
    }
  }

  return instances
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = createServerClient()
  const now = new Date()
  const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const fromDate = from ? new Date(from) : now
  const toDate = to ? new Date(to) : ninetyDaysOut

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = data ?? []
  const result: Record<string, unknown>[] = []

  for (const event of events) {
    if (event.recurring && event.recurring_pattern) {
      result.push(...expandRecurring(event, fromDate, toDate))
    } else {
      const startDate = new Date(event.start_date)
      const endDate = event.end_date ? new Date(event.end_date) : startDate
      // Include event if it overlaps with [fromDate, toDate] range
      if (startDate <= toDate && endDate >= fromDate) {
        result.push({ ...event, _instance_date: event.start_date.slice(0, 10) })
      }
    }
  }

  result.sort((a, b) =>
    new Date(a.start_date as string).getTime() - new Date(b.start_date as string).getTime()
  )

  return NextResponse.json(result)
}
