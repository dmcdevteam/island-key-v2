'use client'

import { Suspense, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORY_LABELS: Record<string, string> = {
  car:          'Cars',
  atv_motorbike: 'ATV & Motorbike',
  bike_ebike:   'Bike & E-Bike',
  boat:         'Boat',
}

const CATEGORY_BG: Record<string, string> = {
  car:          'linear-gradient(135deg,#1B2D4F 0%,#2D4A7A 100%)',
  atv_motorbike:'linear-gradient(135deg,#D4854A 0%,#B8612A 100%)',
  bike_ebike:   'linear-gradient(135deg,#1A8A7D 0%,#0D6B60 100%)',
  boat:         'linear-gradient(135deg,#2D4A7A 0%,#1A8A7D 100%)',
}

type Suggestion = { place_id: string; description: string; types: string[] }
type PlaceResult = { display_name: string; place_id: string; lat: number; lng: number }

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()
const TODAY = new Date().toISOString().split('T')[0]

function PlacesInput({
  placeholder,
  value,
  onSelect,
  onClear,
}: {
  placeholder: string
  value: PlaceResult | null
  onSelect: (p: PlaceResult) => void
  onClear: () => void
}) {
  const [text, setText] = useState(value?.display_name ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSuggestions(input: string) {
    if (input.length < 2) { setSuggestions([]); return }
    try {
      const res  = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
    } catch { setSuggestions([]) }
  }

  function handleChange(v: string) {
    setText(v)
    onClear()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetchSuggestions(v).then(() => setOpen(true))
    }, 300)
  }

  async function selectSuggestion(s: Suggestion) {
    setOpen(false)
    setSuggestions([])
    setText(s.description)
    try {
      const res  = await fetch(`/api/places/details?place_id=${encodeURIComponent(s.place_id)}`)
      const data = await res.json()
      if (!data.error) {
        onSelect({ display_name: data.name || s.description, place_id: data.place_id, lat: data.lat, lng: data.lng })
        setText(data.name || s.description)
      }
    } catch { /* keep typed text */ }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white border border-border-light rounded-xl">
        <span style={{ color: '#D4854A', fontSize: 16, flexShrink: 0 }}>📍</span>
        <input
          value={text}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 text-sm text-navy placeholder-gray-400 outline-none bg-transparent"
        />
        {text && (
          <button
            onMouseDown={() => { setText(''); onClear(); setSuggestions([]); setOpen(false) }}
            className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0"
          >×</button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border-light rounded-xl shadow-xl z-50 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.place_id}
              onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
            >
              <span className="text-gray-400 flex-shrink-0 mt-px">
                {s.types.includes('airport') ? '✈' : '📍'}
              </span>
              <span className="truncate">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchContent() {
  const router = useRouter()
  const sp     = useSearchParams()
  const category = sp.get('category') ?? 'car'

  const [pickup,   setPickup]   = useState<PlaceResult | null>(null)
  const [dropoff,  setDropoff]  = useState<PlaceResult | null>(null)
  const [diffDropoff, setDiffDropoff] = useState(false)

  const [pickupDate,  setPickupDate]  = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [pickupTime,  setPickupTime]  = useState('11:00')
  const [dropoffTime, setDropoffTime] = useState('11:00')

  const [showDates, setShowDates] = useState(false)

  const canSearch = !!(pickup && pickupDate && dropoffDate)

  function handleSearch() {
    if (!canSearch || !pickup) return
    const params = new URLSearchParams({
      pickup_name:     pickup.display_name,
      pickup_place_id: pickup.place_id,
      pickup_lat:      String(pickup.lat),
      pickup_lng:      String(pickup.lng),
      pickup_date:     pickupDate,
      dropoff_date:    dropoffDate,
      pickup_time:     pickupTime,
      dropoff_time:    dropoffTime,
      category,
    })
    if (diffDropoff && dropoff) {
      params.set('diff_dropoff',     'true')
      params.set('dropoff_name',     dropoff.display_name)
      params.set('dropoff_place_id', dropoff.place_id)
    }
    router.push(`/rentals/cars/results?${params.toString()}`)
  }

  const dateDisplay = pickupDate && dropoffDate
    ? `${pickupDate.split('-').reverse().join('/')} – ${dropoffDate.split('-').reverse().join('/')}`
    : 'Select dates'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-[72px] px-5 pb-10"
      style={{ background: CATEGORY_BG[category] ?? CATEGORY_BG.car }}
    >
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="self-start mb-4 text-white/70 hover:text-white text-sm font-medium"
      >← Back</button>

      <div className="w-full max-w-[440px]">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">
          {CATEGORY_LABELS[category] ?? 'Rentals'}
        </h1>
        <p className="text-white/60 text-sm mb-6">Tell us where and when</p>

        <div className="bg-white rounded-2xl shadow-2xl overflow-visible space-y-0">

          {/* Pick-up location */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pick-up Location</p>
            <PlacesInput
              placeholder="Hotel, address or landmark"
              value={pickup}
              onSelect={setPickup}
              onClear={() => setPickup(null)}
            />
          </div>

          <div className="mx-4 border-t border-gray-100" />

          {/* Rental dates */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rental Dates</p>
            <button
              onClick={() => setShowDates(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-sm text-navy"
            >
              <span style={{ color: '#D4854A' }}>📅</span>
              <span className={pickupDate && dropoffDate ? 'text-navy' : 'text-gray-400'}>{dateDisplay}</span>
            </button>
            {showDates && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Pick-up</label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={TODAY}
                    onChange={e => {
                      setPickupDate(e.target.value)
                      if (dropoffDate && e.target.value >= dropoffDate) setDropoffDate('')
                    }}
                    className="w-full border border-border-light rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Drop-off</label>
                  <input
                    type="date"
                    value={dropoffDate}
                    min={pickupDate || TODAY}
                    onChange={e => setDropoffDate(e.target.value)}
                    className="w-full border border-border-light rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mx-4 border-t border-gray-100" />

          {/* Times */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Pick-up Time</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span style={{ color: '#D4854A', fontSize: 14 }}>🕐</span>
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="flex-1 text-sm text-navy outline-none bg-transparent"
                >
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Drop-off Time</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span style={{ color: '#D4854A', fontSize: 14 }}>🕐</span>
                <select
                  value={dropoffTime}
                  onChange={e => setDropoffTime(e.target.value)}
                  className="flex-1 text-sm text-navy outline-none bg-transparent"
                >
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mx-4 border-t border-gray-100" />

          {/* Different drop-off */}
          <div className="px-4 py-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={diffDropoff}
                onChange={e => { setDiffDropoff(e.target.checked); if (!e.target.checked) setDropoff(null) }}
                className="rounded border-gray-300 text-navy"
              />
              <span className="text-sm text-tx-mid font-medium">Different drop-off?</span>
            </label>
            {diffDropoff && (
              <div className="mt-2">
                <PlacesInput
                  placeholder="Drop-off location"
                  value={dropoff}
                  onSelect={setDropoff}
                  onClear={() => setDropoff(null)}
                />
              </div>
            )}
          </div>

          {/* Search button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full py-3.5 rounded-xl bg-navy text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
            >
              <span>🔍</span> Search
            </button>
            {!pickup && <p className="text-[11px] text-gray-400 text-center mt-2">Enter a pick-up location to continue</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RentalsSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <SearchContent />
    </Suspense>
  )
}
