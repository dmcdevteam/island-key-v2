'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DateRangePicker, { toDate, fromDate } from '@/components/ui/date-range-picker'

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

type Suggestion   = { place_id: string; description: string; types: string[] }
type PlaceResult  = { display_name: string; place_id: string; lat: number; lng: number }

type RentalPickupLocation = {
  id: string; name: string; city: string | null; address: string | null
  google_maps_url: string | null; vehicle_categories: string[]
}

type RentalPort = {
  id: string; name: string; area: string; address: string | null
}

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
  placeholder, value, onSelect, onClear,
}: {
  placeholder: string; value: PlaceResult | null
  onSelect: (p: PlaceResult) => void; onClear: () => void
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
    setText(v); onClear()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetchSuggestions(v).then(() => setOpen(true))
    }, 300)
  }

  async function selectSuggestion(s: Suggestion) {
    setOpen(false); setSuggestions([]); setText(s.description)
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
  const router   = useRouter()
  const sp       = useSearchParams()
  const category = sp.get('category') ?? 'car'

  const isCarAtv = category === 'car' || category === 'atv_motorbike'
  const isBike   = category === 'bike_ebike'
  const isBoat   = category === 'boat'

  // ── Car/ATV pickup state ──────────────────────────────────────────────────
  const [locations,          setLocations]          = useState<RentalPickupLocation[]>([])
  const [locLoading,         setLocLoading]         = useState(false)
  const [pickupType,         setPickupType]         = useState<'location' | 'delivery'>('location')
  const [selectedLocationId,      setSelectedLocationId]      = useState<string | null>(null)
  const [selectedLocationName,    setSelectedLocationName]    = useState<string | null>(null)
  const [selectedLocationAddress, setSelectedLocationAddress] = useState<string | null>(null)
  const [selectedLocationGMapsUrl,setSelectedLocationGMapsUrl]= useState<string | null>(null)
  const [deliveryPlace,      setDeliveryPlace]      = useState<PlaceResult | null>(null)
  const [locDropdownOpen,    setLocDropdownOpen]    = useState(false)
  const locDropdownRef = useRef<HTMLDivElement>(null)

  // ── Bike pickup state (unchanged) ────────────────────────────────────────
  const [pickup,      setPickup]      = useState<PlaceResult | null>(null)
  const [dropoff,     setDropoff]     = useState<PlaceResult | null>(null)
  const [diffDropoff, setDiffDropoff] = useState(false)

  // ── Boat port state ───────────────────────────────────────────────────────
  const [ports,           setPorts]           = useState<RentalPort[]>([])
  const [portsLoading,    setPortsLoading]    = useState(false)
  const [selectedPortId,  setSelectedPortId]  = useState<string | null>(null)
  const [selectedPortName,setSelectedPortName]= useState<string | null>(null)

  // ── Shared date/time state ────────────────────────────────────────────────
  const [pickupDate,  setPickupDate]  = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [pickupTime,  setPickupTime]  = useState('11:00')
  const [dropoffTime, setDropoffTime] = useState('11:00')

  useEffect(() => {
    if (!isCarAtv) return
    setLocLoading(true)
    fetch(`/api/rentals/pickup-locations?category=${category}`)
      .then(r => r.json())
      .then(d => { setLocations(Array.isArray(d.locations) ? d.locations : []); setLocLoading(false) })
      .catch(() => setLocLoading(false))
  }, [category, isCarAtv])

  useEffect(() => {
    if (!isBoat) return
    setPortsLoading(true)
    fetch('/api/rentals/ports')
      .then(r => r.json())
      .then(d => { setPorts(Array.isArray(d.ports) ? d.ports : []); setPortsLoading(false) })
      .catch(() => setPortsLoading(false))
  }, [isBoat])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
        setLocDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const CITY_ORDER = ['Chania', 'Rethymnon', 'Heraklion']
  const groupedLocations = CITY_ORDER
    .map(city => ({ city, locs: locations.filter(l => (l.city ?? 'Chania') === city) }))
    .filter(g => g.locs.length > 0)

  const canSearch = (() => {
    if (!pickupDate || !dropoffDate) return false
    if (isCarAtv) return pickupType === 'location' ? !!selectedLocationId : !!deliveryPlace
    if (isBike)   return !!pickup
    if (isBoat)   return !!selectedPortId
    return false
  })()

  function handleSearch() {
    if (!canSearch) return
    const params = new URLSearchParams({
      pickup_date: pickupDate, dropoff_date: dropoffDate,
      pickup_time: pickupTime, dropoff_time: dropoffTime,
      category,
    })
    if (isCarAtv) {
      if (pickupType === 'location') {
        params.set('pickup_type', 'location')
        params.set('pickup_location_id', selectedLocationId!)
        params.set('pickup_location_name', selectedLocationName!)
        params.set('pickup_name', selectedLocationName!) // compat
      } else {
        params.set('pickup_type', 'delivery')
        params.set('delivery_address', deliveryPlace!.display_name)
        params.set('delivery_place_id', deliveryPlace!.place_id)
        params.set('pickup_name', deliveryPlace!.display_name)
      }
      router.push(`/rentals/cars/results?${params.toString()}`)
    } else if (isBike) {
      if (pickup) {
        params.set('pickup_name', pickup.display_name)
        params.set('pickup_place_id', pickup.place_id)
        params.set('pickup_lat', String(pickup.lat))
        params.set('pickup_lng', String(pickup.lng))
      }
      if (diffDropoff && dropoff) {
        params.set('diff_dropoff', 'true')
        params.set('dropoff_name', dropoff.display_name)
        params.set('dropoff_place_id', dropoff.place_id)
      }
      router.push(`/rentals/cars/results?${params.toString()}`)
    } else if (isBoat) {
      params.set('port_id', selectedPortId!)
      params.set('port_name', selectedPortName!)
      router.push(`/rentals/boats/coming-soon?${params.toString()}`)
    }
  }

  function handleLocationSelect(loc: RentalPickupLocation) {
    setSelectedLocationId(loc.id)
    setSelectedLocationName(loc.name)
    setSelectedLocationAddress(loc.address ?? null)
    setSelectedLocationGMapsUrl(loc.google_maps_url ?? null)
  }

  function handleDeliveryToggle(on: boolean) {
    setPickupType(on ? 'delivery' : 'location')
    if (on) { setSelectedLocationId(null); setSelectedLocationName(null); setSelectedLocationAddress(null); setSelectedLocationGMapsUrl(null) }
    else    { setDeliveryPlace(null) }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-[72px] px-5 pb-10"
      style={{ background: CATEGORY_BG[category] ?? CATEGORY_BG.car }}
    >
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

          {/* ── Car / ATV: grouped pickup dropdown ── */}
          {isCarAtv && (
            <>
              <div className="px-4 pt-4 pb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Pick-up Location</p>

                {locLoading && <p className="text-sm text-gray-400 py-2">Loading locations…</p>}

                {!locLoading && (
                  <>
                    {/* Dropdown trigger */}
                    <div className="relative" ref={locDropdownRef}>
                      <button
                        onClick={() => setLocDropdownOpen(o => !o)}
                        className="w-full flex items-center gap-3 px-4 py-4 bg-white border-2 border-border rounded-xl text-left"
                      >
                        <span style={{ color: '#D4854A', fontSize: 16, flexShrink: 0 }}>📍</span>
                        <span className={`flex-1 text-sm ${selectedLocationId && pickupType === 'location' ? 'text-navy font-medium' : 'text-gray-400'}`}>
                          {selectedLocationId && pickupType === 'location' ? selectedLocationName : 'Select pick-up location'}
                        </span>
                        <span className="text-gray-400 text-xs" style={{ transform: locDropdownOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▼</span>
                      </button>

                      {/* Dropdown panel */}
                      {locDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl z-50 overflow-y-auto" style={{ maxHeight: 280 }}>
                          {groupedLocations.map((group, gi) => (
                            <div key={group.city}>
                              {gi > 0 && <div className="border-t border-gray-100 mx-4" />}
                              <p className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{group.city}</p>
                              {group.locs.map(loc => {
                                const selected = selectedLocationId === loc.id && pickupType === 'location'
                                return (
                                  <button
                                    key={loc.id}
                                    onClick={() => { handleDeliveryToggle(false); handleLocationSelect(loc); setLocDropdownOpen(false) }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-colors ${
                                      selected ? 'border-teal' : 'border-transparent hover:bg-gray-50'
                                    }`}
                                  >
                                    <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
                                    <span className={`text-sm ${selected ? 'text-teal' : 'text-navy'}`}>{loc.name}</span>
                                  </button>
                                )
                              })}
                            </div>
                          ))}

                          {/* Deliver to me */}
                          <div className="border-t border-gray-100" />
                          <button
                            onClick={() => { handleDeliveryToggle(true); setLocDropdownOpen(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                          >
                            <span style={{ fontSize: 14, flexShrink: 0 }}>🚚</span>
                            <span className="text-sm font-medium text-terra">Deliver to my accommodation</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delivery address input */}
                    {pickupType === 'delivery' && (
                      <div className="mt-3">
                        <PlacesInput
                          placeholder="Enter your address or accommodation name"
                          value={deliveryPlace}
                          onSelect={setDeliveryPlace}
                          onClear={() => setDeliveryPlace(null)}
                        />
                        <p className="text-[11px] text-amber-600 italic mt-2 flex items-start gap-1">
                          <span>⚠️</span>
                          <span>Delivery is available on request — extra charges may apply. We will confirm delivery fee with your enquiry.</span>
                        </p>
                      </div>
                    )}

                    {/* Static map for selected pickup location */}
                    {pickupType === 'location' && selectedLocationId && selectedLocationAddress && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(selectedLocationAddress)}&zoom=14&size=600x200&markers=color:0x1B2D4F%7C${encodeURIComponent(selectedLocationAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                          alt={selectedLocationName ?? 'Pickup location'}
                          className="w-full rounded-xl border border-border-light"
                        />
                        <a
                          href={selectedLocationGMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(selectedLocationAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal font-medium mt-2 inline-block"
                        >Open in Google Maps →</a>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mx-4 border-t border-gray-100" />
            </>
          )}

          {/* ── Bike: existing Places input ── */}
          {isBike && (
            <>
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
            </>
          )}

          {/* ── Boat: port selector ── */}
          {isBoat && (
            <>
              <div className="px-4 pt-4 pb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Departure Port</p>

                {portsLoading && <p className="text-sm text-gray-400 py-2">Loading ports…</p>}

                {!portsLoading && ports.length > 0 && (
                  <div className="space-y-2">
                    {ports.map(port => {
                      const selected = selectedPortId === port.id
                      return (
                        <button
                          key={port.id}
                          onClick={() => { setSelectedPortId(port.id); setSelectedPortName(port.name) }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? 'border-navy bg-navy/5'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <span style={{ color: '#2D4A7A', fontSize: 18, flexShrink: 0 }}>⚓</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${selected ? 'text-navy' : 'text-gray-700'}`}>{port.name}</p>
                            {port.area && <p className="text-[11px] text-gray-400 mt-0.5">{port.area}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="mx-4 border-t border-gray-100" />
            </>
          )}

          {/* ── Rental dates ── */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rental Dates</p>
            <DateRangePicker
              startDate={toDate(pickupDate)}
              endDate={toDate(dropoffDate)}
              onChange={(s, e) => {
                setPickupDate(fromDate(s))
                setDropoffDate(fromDate(e))
              }}
              placeholder="Pick-up → Drop-off"
            />
          </div>

          <div className="mx-4 border-t border-gray-100" />

          {/* ── Times ── */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Pick-up Time</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span style={{ color: '#D4854A', fontSize: 14 }}>🕐</span>
                <select value={pickupTime} onChange={e => setPickupTime(e.target.value)}
                  className="flex-1 text-sm text-navy outline-none bg-transparent">
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Drop-off Time</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span style={{ color: '#D4854A', fontSize: 14 }}>🕐</span>
                <select value={dropoffTime} onChange={e => setDropoffTime(e.target.value)}
                  className="flex-1 text-sm text-navy outline-none bg-transparent">
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Bike only: different drop-off ── */}
          {isBike && (
            <>
              <div className="mx-4 border-t border-gray-100" />
              <div className="px-4 py-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={diffDropoff}
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
            </>
          )}

          {/* ── Search button ── */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full py-3.5 rounded-xl bg-navy text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
            >
              <span>🔍</span> Search
            </button>
            {!canSearch && pickupDate && dropoffDate && (
              <p className="text-[11px] text-gray-400 text-center mt-2">
                {isCarAtv && pickupType === 'location' && !selectedLocationId ? 'Select a pick-up location to continue' : ''}
                {isCarAtv && pickupType === 'delivery' && !deliveryPlace ? 'Enter a delivery address to continue' : ''}
                {isBike && !pickup ? 'Enter a pick-up location to continue' : ''}
                {isBoat && !selectedPortId ? 'Select a departure port to continue' : ''}
              </p>
            )}
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
