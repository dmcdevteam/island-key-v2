'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FocalImage } from '@/components/FocalImage'

type Port = { id: string; name: string; area: string | null; lat: number | null; lng: number | null }
type BoatRental = {
  id: string; name: string; car_class: string | null; description: string | null
  price_per_day: number; images: string[] | null; image_wide: string | null
  image_square: string | null; focal_x: number | null; focal_y: number | null
  features: Record<string, boolean> | null
  capacity: number | null; length_m: number | null; engine_power: number | null
  year_built: number | null; licence_required: boolean; with_skipper: boolean
  fuel_included: boolean; checkin_time: string | null; checkout_time: string | null
  rental_ports: Port | null
}

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function BoatResultsContent() {
  const router = useRouter()
  const sp     = useSearchParams()

  const city       = sp.get('city')         ?? ''
  const portId     = sp.get('port_id')      ?? ''
  const portName   = sp.get('port_name')    ?? ''
  const startDate  = sp.get('start_date')   ?? sp.get('pickup_date') ?? ''
  const endDate    = sp.get('end_date')     ?? sp.get('dropoff_date') ?? ''
  const withSkip   = sp.get('with_skipper') ?? ''
  const days       = startDate && endDate ? daysBetween(startDate, endDate) : 1

  const [boats,       setBoats]       = useState<BoatRental[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filterOpen,  setFilterOpen]  = useState(false)
  const [skipFilter,  setSkipFilter]  = useState(withSkip) // 'true'|'false'|''
  const [classFilter, setClassFilter] = useState('')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [minPeople,   setMinPeople]   = useState(1)
  const [minLen,      setMinLen]      = useState('')
  const [maxLen,      setMaxLen]      = useState('')
  const [minEngine,   setMinEngine]   = useState('')
  const [maxEngine,   setMaxEngine]   = useState('')
  const [liked,       setLiked]       = useState<Record<string, boolean>>({})

  useEffect(() => {
    const params = new URLSearchParams()
    if (city)   params.set('city', city)
    if (portId) params.set('port_id', portId)
    fetch(`/api/rentals/boats?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setBoats(Array.isArray(d.boats) ? d.boats : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [city, portId])

  const filtered = boats.filter(b => {
    if (skipFilter === 'true'  && !b.with_skipper) return false
    if (skipFilter === 'false' &&  b.with_skipper) return false
    if (classFilter && b.car_class !== classFilter) return false
    if (minPrice && (b.price_per_day ?? 0) < parseFloat(minPrice)) return false
    if (maxPrice && (b.price_per_day ?? 0) > parseFloat(maxPrice)) return false
    if (minPeople > 1 && (b.capacity ?? 0) < minPeople) return false
    if (minLen && (b.length_m ?? 0) < parseFloat(minLen)) return false
    if (maxLen && (b.length_m ?? 0) > parseFloat(maxLen)) return false
    if (minEngine && (b.engine_power ?? 0) < parseInt(minEngine)) return false
    if (maxEngine && (b.engine_power ?? 0) > parseInt(maxEngine)) return false
    return true
  }).sort((a, b) => (a.price_per_day ?? 0) - (b.price_per_day ?? 0))

  const distinctClasses = Array.from(new Set(boats.filter(b => b.car_class).map(b => b.car_class!)))

  function clearFilters() {
    setSkipFilter(withSkip)
    setClassFilter('')
    setMinPrice('')
    setMaxPrice('')
    setMinPeople(1)
    setMinLen('')
    setMaxLen('')
    setMinEngine('')
    setMaxEngine('')
  }

  function buildDetailParams(boatId: string) {
    const p = new URLSearchParams(sp.toString())
    p.set('boat_id', boatId)
    return p.toString()
  }

  const summaryLabel = [portName || city, startDate && endDate
    ? `${startDate.split('-').reverse().join('/')} – ${endDate.split('-').reverse().join('/')}`
    : ''].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-24">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-border-light shadow-sm">
        {/* Toggle tabs */}
        <div className="px-4 pt-3 pb-2">
          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
            <button className="py-2 rounded-lg text-sm font-semibold bg-navy text-white">⛵ Boat Rentals</button>
            <button
              onClick={() => router.push('/activities?boat=true')}
              className="py-2 rounded-lg text-sm font-semibold text-tx-mid"
            >🤿 Daily Experiences</button>
          </div>
        </div>

        {/* Search summary */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/rentals/search?category=boat&${sp.toString()}`)}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-sm text-navy font-medium truncate">{summaryLabel || 'Boat Rentals'}</p>
            <p className="text-[11px] text-tx-light">{days} day{days !== 1 ? 's' : ''} · {filtered.length} boat{filtered.length !== 1 ? 's' : ''}</p>
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="w-9 h-9 rounded-full bg-navy flex items-center justify-center flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <FilterPill
            label={skipFilter === 'true' ? 'With skipper' : skipFilter === 'false' ? 'Without skipper' : 'Skipper'}
            active={!!skipFilter}
            onClear={() => setSkipFilter('')}
            options={[
              { label: 'With skipper', value: 'true' },
              { label: 'Without skipper', value: 'false' },
            ]}
            value={skipFilter}
            onChange={setSkipFilter}
          />
          {distinctClasses.length > 1 && (
            <FilterPill
              label={classFilter || 'Boat type'}
              active={!!classFilter}
              onClear={() => setClassFilter('')}
              options={distinctClasses.map(c => ({ label: c, value: c }))}
              value={classFilter}
              onChange={setClassFilter}
            />
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border-light bg-white text-xs font-semibold text-tx-mid whitespace-nowrap"
          >⚙️ Filters</button>
        </div>
      </div>

      {/* Boat list */}
      <div className="px-4 pt-4 space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="aspect-video bg-navy/5 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-navy/5 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-navy/5 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-tx-light text-sm">
            <p className="text-4xl mb-3">⛵</p>
            <p className="font-medium text-navy">No boats match your filters</p>
            <button onClick={clearFilters} className="mt-3 text-teal text-sm font-semibold">Clear filters</button>
          </div>
        )}

        {!loading && filtered.map(boat => {
          const heroSrc = boat.image_wide ?? boat.images?.[0] ?? null
          const features = (boat.features ?? {}) as Record<string, boolean>
          const port = boat.rental_ports

          return (
            <div key={boat.id} className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
              {/* Hero */}
              <div className="relative">
                {heroSrc ? (
                  <FocalImage
                    src={heroSrc}
                    alt={boat.name}
                    className="w-full aspect-video object-cover"
                    focalPoint={boat.focal_x != null && boat.focal_y != null ? { x: boat.focal_x, y: boat.focal_y } : null}
                  />
                ) : (
                  <div className="w-full aspect-video bg-navy/10 flex items-center justify-center">
                    <span className="text-5xl">⛵</span>
                  </div>
                )}
                {/* Heart */}
                <button
                  onClick={() => setLiked(prev => ({ ...prev, [boat.id]: !prev[boat.id] }))}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow text-sm"
                >
                  {liked[boat.id] ? '❤️' : '🤍'}
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                {port && <p className="text-[13px] text-gray-400 mb-1">{port.name}</p>}
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-display text-[17px] text-navy font-semibold leading-tight">{boat.name}</h3>
                  {boat.year_built && <span className="text-[13px] text-gray-400">({boat.year_built})</span>}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {!boat.licence_required
                    ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal/10 text-teal font-semibold">No licence needed</span>
                    : <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Licence required</span>
                  }
                  {boat.with_skipper
                    ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">With skipper</span>
                    : <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Without skipper</span>
                  }
                </div>

                {/* Specs */}
                <p className="text-[12px] text-gray-400 mb-3">
                  {[
                    boat.capacity    ? `${boat.capacity} people` : null,
                    boat.engine_power ? `${boat.engine_power} hp` : null,
                    boat.length_m    ? `${boat.length_m} m` : null,
                  ].filter(Boolean).join(' · ')}
                </p>

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <div>
                    {features.free_cancellation && (
                      <p className="text-[12px] text-teal font-medium">✓ Flexible cancellation</p>
                    )}
                  </div>
                  <p className="text-[18px] font-bold text-navy">€{boat.price_per_day}<span className="text-[13px] font-normal text-tx-light"> / day</span></p>
                </div>

                <button
                  onClick={() => router.push(`/rentals/boats/${boat.id}?${buildDetailParams(boat.id)}`)}
                  className="mt-3 w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform"
                >
                  View Boat →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter bottom sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 w-full max-w-[480px] mx-auto max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg text-navy">Filters</h2>
              <button onClick={clearFilters} className="text-sm text-teal font-semibold">Clear All</button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Price per Day</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Min €</span>
                    <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Max €</span>
                    <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="any"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Number of People (min)</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setMinPeople(n => Math.max(1, n - 1))}
                    className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center text-navy font-bold">−</button>
                  <span className="text-navy font-semibold w-6 text-center">{minPeople}</span>
                  <button onClick={() => setMinPeople(n => n + 1)}
                    className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center text-navy font-bold">+</button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Boat Length (m)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Min</span>
                    <input type="number" step="0.1" value={minLen} onChange={e => setMinLen(e.target.value)} placeholder="0"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                    <span className="text-tx-light text-sm">m</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Max</span>
                    <input type="number" step="0.1" value={maxLen} onChange={e => setMaxLen(e.target.value)} placeholder="any"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                    <span className="text-tx-light text-sm">m</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Engine Power (hp)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Min</span>
                    <input type="number" value={minEngine} onChange={e => setMinEngine(e.target.value)} placeholder="0"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                    <span className="text-tx-light text-sm">hp</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                    <span className="text-tx-light text-sm flex-shrink-0">Max</span>
                    <input type="number" value={maxEngine} onChange={e => setMaxEngine(e.target.value)} placeholder="any"
                      className="flex-1 text-sm text-navy outline-none w-full" />
                    <span className="text-tx-light text-sm">hp</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setFilterOpen(false)}
              className="mt-6 w-full py-3 bg-navy text-white font-semibold rounded-xl text-sm"
            >
              Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPill({ label, active, onClear, options, value, onChange }: {
  label: string; active: boolean; onClear: () => void
  options: { label: string; value: string }[]
  value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors ${
          active ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border-light'
        }`}
      >
        {label} <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-border-light rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(value === o.value ? '' : o.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 ${
                value === o.value ? 'text-teal font-semibold' : 'text-navy hover:bg-gray-50'
              }`}
            >{o.label}</button>
          ))}
          {active && (
            <button onClick={() => { onClear(); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 border-t border-gray-100">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function BoatResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center text-tx-light text-sm">Loading…</div>}>
      <BoatResultsContent />
    </Suspense>
  )
}
