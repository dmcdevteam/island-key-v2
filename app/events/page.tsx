'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { HeartButton } from '@/components/ui/components'
import { ProfileAvatar } from '@/app/_components/profile-avatar'
import type { EventFull } from '@/lib/types'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  festival: '#D4854A', music: '#1B2D4F', food: '#D4A843', sport: '#1A8A7D',
  cultural: '#9B59B6', market: '#1A8A7D', nightlife: '#D94F4F', family: '#3498DB', other: '#5A5A5A',
}

type Tab = 'week' | 'month' | 'upcoming'
type EventInstance = EventFull & { _instance_date?: string }

function getToday() { return new Date().toISOString().slice(0, 10) }

function buildDayStrip(tab: 'week' | 'month') {
  const DW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const days: { date: string; dw: string; dn: number }[] = []

  if (tab === 'week') {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      days.push({ date: d.toISOString().slice(0, 10), dw: DW[d.getDay()], dn: d.getDate() })
    }
  } else {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = now.getDate(); day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      days.push({ date: d.toISOString().slice(0, 10), dw: DW[d.getDay()], dn: d.getDate() })
    }
  }
  return days
}

function formatDayHeader(dateStr: string) {
  const today = getToday()
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatMonthLabel(yearMonth: string) {
  return new Date(yearMonth + '-01T00:00:00').toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function EventCard({ ev, onClick }: { ev: EventInstance; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[ev.category ?? 'other'] ?? '#5A5A5A'
  const coverImage = ev.images?.[0] ?? null
  const timeStr = ev.all_day
    ? 'All day'
    : new Date(ev.start_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <button
      onClick={onClick}
      className="w-full mb-3 bg-white rounded-sm border border-border-light overflow-hidden active:scale-[0.98] transition-transform text-left"
    >
      {/* Cover image — 16:9 */}
      <div className="w-full overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt={ev.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: catColor }}>
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{ev.category ?? 'event'}</span>
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          <HeartButton item={{ id: ev.id, type: 'event', slug: ev.slug, title: ev.title, image: coverImage, price: ev.price_label }} />
        </div>
      </div>
      {/* Details */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold text-tx-light">{timeStr}</span>
          {ev.category && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
              style={{ background: catColor }}>{ev.category}</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-navy leading-snug mb-0.5">{ev.title}</h3>
        {ev.location_name && <p className="text-[11px] text-tx-light">📍 {ev.location_name}</p>}
        {!ev.is_free && ev.price_label && (
          <p className="text-[11px] text-tx-light mt-0.5">{ev.price_label}</p>
        )}
        {ev.is_free && <p className="text-[11px] font-semibold text-teal mt-0.5">Free entry</p>}
      </div>
    </button>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [allEvents, setAllEvents] = useState<EventInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getToday())

  useEffect(() => {
    const now = new Date()
    const far = new Date(now.getFullYear() + 2, 11, 31)
    const params = new URLSearchParams({ from: now.toISOString(), to: far.toISOString() })
    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(data => {
        setAllEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Reset selected date when switching to week/month
  useEffect(() => {
    if (activeTab !== 'upcoming') {
      setSelectedDate(getToday())
    }
  }, [activeTab])

  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  function getTabEvents(): EventInstance[] {
    if (activeTab === 'week') {
      return allEvents.filter(e => {
        const d = new Date((e._instance_date ?? e.start_date.slice(0, 10)) + 'T00:00:00')
        return d >= now && d <= weekEnd
      })
    }
    if (activeTab === 'month') {
      return allEvents.filter(e => {
        const d = new Date((e._instance_date ?? e.start_date.slice(0, 10)) + 'T00:00:00')
        return d >= now && d <= monthEnd
      })
    }
    return allEvents
  }

  const tabEvents = getTabEvents()
  const datesWithEvents = new Set(tabEvents.map(e => e._instance_date ?? e.start_date.slice(0, 10)))
  const days = activeTab !== 'upcoming' ? buildDayStrip(activeTab) : []
  const selectedDayEvents = activeTab !== 'upcoming'
    ? tabEvents.filter(e => (e._instance_date ?? e.start_date.slice(0, 10)) === selectedDate)
    : []

  // Group allEvents by month → date for All Upcoming
  function groupByMonth() {
    const monthOrder: string[] = []
    const monthMap: Record<string, Record<string, EventInstance[]>> = {}
    for (const ev of tabEvents) {
      const dateStr = ev._instance_date ?? ev.start_date.slice(0, 10)
      const ym = dateStr.slice(0, 7)
      if (!monthMap[ym]) { monthMap[ym] = {}; monthOrder.push(ym) }
      ;(monthMap[ym][dateStr] ??= []).push(ev)
    }
    return monthOrder.map(ym => ({ ym, label: formatMonthLabel(ym), byDate: monthMap[ym] }))
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
            <h1 className="font-display text-xl font-medium text-navy">What&apos;s Happening</h1>
          </div>
          <ProfileAvatar />
        </div>
        <p className="text-xs text-tx-light mt-0.5">Curated events across Crete</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-3 bg-white rounded-sm border border-border-light overflow-hidden">
        {(['upcoming', 'week', 'month'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 py-2.5 text-[11px] font-semibold transition-all border-r border-border-light last:border-r-0',
              activeTab === tab ? 'bg-navy text-white' : 'text-tx-light'
            )}>
            {tab === 'upcoming' ? 'All Upcoming' : tab === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Date strip — only for week/month tabs */}
      {activeTab !== 'upcoming' && (
        <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
          {days.map(day => {
            const has = datesWithEvents.has(day.date)
            const isSelected = selectedDate === day.date
            return (
              <button key={day.date} onClick={() => setSelectedDate(day.date)}
                className={clsx(
                  'min-w-[52px] py-2.5 px-1.5 text-center rounded-sm border-[1.5px] flex-shrink-0 transition-all flex flex-col items-center',
                  isSelected ? 'bg-navy border-navy' : has ? 'bg-white border-teal/40' : 'bg-white border-border-light'
                )}>
                <span className={clsx('text-[9px] font-bold uppercase mb-0.5', isSelected ? 'text-white/60' : 'text-tx-light')}>{day.dw}</span>
                <span className={clsx('text-lg font-bold', isSelected ? 'text-white' : 'text-navy')}>{day.dn}</span>
                <div className={clsx('w-[5px] h-[5px] rounded-full mt-1',
                  isSelected && has ? 'bg-white' : has ? 'bg-teal' : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-navy/5 rounded-sm animate-pulse" />
            ))}
          </div>
        )}

        {/* All Upcoming — grouped by month then date */}
        {!loading && activeTab === 'upcoming' && (
          tabEvents.length === 0 ? (
            <div className="text-center pt-20 px-8">
              <p className="text-3xl mb-3">📅</p>
              <p className="text-sm text-tx-light">Nothing scheduled right now — check back soon.</p>
            </div>
          ) : (
            groupByMonth().map(({ ym, label, byDate }) => (
              <div key={ym} className="mb-6">
                <div className="mb-3">
                  <h2 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest">{label}</h2>
                </div>
                {Object.entries(byDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, evs]) => (
                    <div key={dateStr} className="mb-1">
                      <p className="text-xs font-semibold text-navy mb-1.5">{formatDayHeader(dateStr)}</p>
                      {evs.map((ev, i) => (
                        <EventCard key={`${ev.id}-${i}`} ev={ev} onClick={() => router.push(`/events/${ev.slug}`)} />
                      ))}
                    </div>
                  ))}
              </div>
            ))
          )
        )}

        {/* Week/Month — filtered by selected date chip */}
        {!loading && activeTab !== 'upcoming' && (
          selectedDayEvents.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-navy mb-3">{formatDayHeader(selectedDate)}</p>
              {selectedDayEvents.map((ev, i) => (
                <EventCard key={`${ev.id}-${i}`} ev={ev} onClick={() => router.push(`/events/${ev.slug}`)} />
              ))}
            </div>
          ) : (
            <div className="text-center pt-16 px-8">
              <p className="text-3xl mb-3">📅</p>
              <p className="text-sm text-tx-light">No events on this day.</p>
              {datesWithEvents.size > 0 && (
                <p className="text-xs text-tx-light mt-1">Try selecting a day with a teal dot.</p>
              )}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  )
}
