'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import type { EventFull } from '@/lib/types'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  festival: '#D4854A', music: '#1B2D4F', food: '#D4A843', sport: '#1A8A7D',
  cultural: '#9B59B6', market: '#1A8A7D', nightlife: '#D94F4F', family: '#3498DB', other: '#5A5A5A',
}

type EventInstance = EventFull & { _instance_date?: string }

function buildDayStrip() {
  const days = []
  const DW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({ date: d.toISOString().slice(0, 10), dw: DW[d.getDay()], dn: d.getDate() })
  }
  return days
}

function formatDayHeader(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function EventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'upcoming'>('week')
  const [events, setEvents] = useState<EventInstance[]>([])
  const [loading, setLoading] = useState(true)
  const days = buildDayStrip()
  const [selectedDate, setSelectedDate] = useState(days[0].date)

  useEffect(() => {
    const now = new Date()
    const to = new Date(now.getTime() + 90 * 24 * 3600 * 1000)
    const params = new URLSearchParams({
      from: now.toISOString(),
      to: to.toISOString(),
    })
    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(data => {
        const fetched: EventInstance[] = Array.isArray(data) ? data : []
        setEvents(fetched)
        const datesWithEvents = new Set(fetched.map(e => e._instance_date ?? e.start_date.slice(0, 10)))
        const first = days.find(d => datesWithEvents.has(d.date))
        if (first) setSelectedDate(first.date)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  function getFilteredEvents(): EventInstance[] {
    if (activeTab === 'week') {
      return events.filter(e => {
        const d = new Date((e._instance_date ?? e.start_date.slice(0, 10)) + 'T00:00:00')
        return d >= now && d <= weekEnd
      })
    }
    if (activeTab === 'month') {
      return events.filter(e => {
        const d = new Date((e._instance_date ?? e.start_date.slice(0, 10)) + 'T00:00:00')
        return d >= now && d <= monthEnd
      })
    }
    return events
  }

  const filteredEvents = getFilteredEvents()

  // Group by date for display
  const byDate = filteredEvents.reduce<Record<string, EventInstance[]>>((acc, ev) => {
    const d = ev._instance_date ?? ev.start_date.slice(0, 10)
    ;(acc[d] ??= []).push(ev)
    return acc
  }, {})

  const datesWithEvents = new Set(events.map(e => e._instance_date ?? e.start_date.slice(0, 10)))

  // For date strip, show current day's events in date-strip tab view
  const currentDayEvents = byDate[selectedDate] ?? []

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">What&apos;s Happening</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Curated events across Crete</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-3 bg-white rounded-sm border border-border-light overflow-hidden">
        {(['week', 'month', 'upcoming'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 py-2.5 text-[11px] font-semibold transition-all border-r border-border-light last:border-r-0',
              activeTab === tab ? 'bg-navy text-white' : 'text-tx-light'
            )}>
            {tab === 'week' ? 'This Week' : tab === 'month' ? 'This Month' : 'All Upcoming'}
          </button>
        ))}
      </div>

      {/* Date strip */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
        {days.map(day => {
          const has = datesWithEvents.has(day.date)
          const isSelected = selectedDate === day.date
          return (
            <button key={day.date} onClick={() => setSelectedDate(day.date)}
              className={clsx(
                'min-w-[52px] py-2.5 px-1.5 text-center rounded-sm border-[1.5px] flex-shrink-0 transition-all flex flex-col items-center',
                isSelected ? 'bg-navy border-navy' : has ? 'bg-white border-teal/30' : 'bg-white border-border-light'
              )}>
              <span className={clsx('text-[9px] font-bold uppercase mb-0.5', isSelected ? 'text-white/60' : 'text-tx-light')}>{day.dw}</span>
              <span className={clsx('text-lg font-bold', isSelected ? 'text-white' : 'text-navy')}>{day.dn}</span>
              <div className={clsx('w-[5px] h-[5px] rounded-full mt-1',
                isSelected && has ? 'bg-white' : has ? 'bg-teal' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-navy/5 rounded-sm animate-pulse" />)}
          </div>
        )}

        {!loading && currentDayEvents.length > 0 && (
          <>
            <div className="px-5 mb-2">
              <p className="text-xs font-semibold text-tx-mid">{formatDayHeader(selectedDate)}</p>
            </div>
            {currentDayEvents.map((ev, i) => (
              <button key={`${ev.id}-${i}`} onClick={() => router.push(`/events/${ev.slug}`)}
                className="w-full mx-5 mb-2.5 p-3.5 bg-white rounded-sm border border-border-light flex gap-3.5 items-start active:scale-[0.98] transition-transform"
                style={{ width: 'calc(100% - 40px)' }}>
                <div className="min-w-[48px] text-center flex-shrink-0">
                  {ev.all_day ? (
                    <span className="text-[10px] font-semibold text-teal">All day</span>
                  ) : (
                    <>
                      <div className="text-[15px] font-bold text-navy">
                        {new Date(ev.start_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </>
                  )}
                </div>
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[ev.category ?? 'other'] ?? '#5A5A5A' }} />
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-semibold text-navy mb-0.5 leading-snug">{ev.title}</h3>
                  {ev.location_name && <p className="text-[11px] text-tx-light">📍 {ev.location_name}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {ev.is_free ? (
                      <span className="text-[10px] font-semibold text-teal">Free</span>
                    ) : ev.price_label ? (
                      <span className="text-[10px] text-tx-light">{ev.price_label}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {!loading && currentDayEvents.length === 0 && (
          <div className="text-center pt-16 px-8">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-tx-light">No events on this day.</p>
            <p className="text-xs text-tx-light mt-1">Try selecting a day with a teal dot.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
