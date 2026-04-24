import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = data ?? []

  // Match events where start_date date portion = today, or recurring events that land on today
  const todayEvents = events.filter(ev => {
    const startDay = (ev.start_date as string).slice(0, 10)
    if (!ev.recurring) {
      const endDay = ev.end_date ? (ev.end_date as string).slice(0, 10) : startDay
      return startDay <= today && today <= endDay
    }

    // For recurring events, check if today is a valid instance
    const start = new Date(ev.start_date as string)
    const todayDate = new Date(today + 'T00:00:00')
    if (todayDate < start) return false

    const pattern = ev.recurring_pattern as string
    if (pattern === 'weekly') {
      return todayDate.getDay() === start.getDay()
    } else if (pattern === 'monthly') {
      return todayDate.getDate() === start.getDate()
    } else if (pattern === 'annual') {
      return todayDate.getMonth() === start.getMonth() && todayDate.getDate() === start.getDate()
    }
    return false
  })

  return NextResponse.json(todayEvents)
}
