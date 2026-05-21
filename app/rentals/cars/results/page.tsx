'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FocalImage } from '@/components/FocalImage'
import type { CarRental } from '@/lib/types'

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  // Cars
  small:         'Small Car',
  medium:        'Medium Car',
  compact:       'Compact Car',
  suv:           'SUV',
  convertible:   'Convertible',
  van:           'Van',
  luxury:        'Luxury',
  offroad:       '4×4 Off-Road',
  // ATV / Motorbike
  atv:           'ATV / Quad',
  motorbike:     'Motorbike',
  scooter:       'Scooter',
  buggy:         'Buggy',
  // Bike / E-Bike
  city_bike:     'City Bike',
  ebike:         'E-Bike',
  mountain_bike: 'Mountain Bike',
}

function vehicleClassLabel(cls: string): string {
  return VEHICLE_CLASS_LABELS[cls] ?? cls.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const CAR_CLASS_GRADIENTS: Record<string, string> = {
  small:       'linear-gradient(135deg,#1B2D4F,#2D4A7A)',
  medium:      'linear-gradient(135deg,#2D4A7A,#1A8A7D)',
  compact:     'linear-gradient(135deg,#1A8A7D,#0D6B60)',
  suv:         'linear-gradient(135deg,#D4854A,#B8612A)',
  convertible: 'linear-gradient(135deg,#B8612A,#D4A843)',
  van:         'linear-gradient(135deg,#6B7B5E,#4A5A3E)',
  luxury:      'linear-gradient(135deg,#1B2D4F,#0D1A30)',
  offroad:     'linear-gradient(135deg,#6B7B5E,#D4854A)',
}

const FEATURE_LABELS: Record<string, string> = {
  free_driver:         'Free extra driver',
  free_cancellation:   'Free cancellation',
  roadside_assistance: '24h roadside assistance',
  kids_seat:           'Kid\'s seat included',
  no_hidden_charges:   'No hidden charges',
  unlimited_km:        'Unlimited kilometres',
}

type SortMode = 'price' | 'zero_deposit'

type FilterState = {
  transmission: string
  fuel_type:    string
  seats:        string
  car_class:    string
}

const CTA_LABELS: Record<string, string> = {
  car:          'Reserve This Car →',
  atv_motorbike: 'Check Availability →',
  bike_ebike:   'Reserve This Bike →',
  boat:         'Reserve This Boat →',
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime()
  const d2 = new Date(b).getTime()
  return Math.max(1, Math.round((d2 - d1) / 86400000))
}

function ResultsContent() {
  const router = useRouter()
  const sp     = useSearchParams()

  const pickupName         = sp.get('pickup_name')         ?? ''
  const pickupDate         = sp.get('pickup_date')         ?? ''
  const dropoffDate        = sp.get('dropoff_date')        ?? ''
  const pickupTime         = sp.get('pickup_time')         ?? ''
  const dropoffTime        = sp.get('dropoff_time')        ?? ''
  const pickupPlaceId      = sp.get('pickup_place_id')     ?? ''
  const pickupLat          = sp.get('pickup_lat')          ?? ''
  const pickupLng          = sp.get('pickup_lng')          ?? ''
  const diffDropoff        = sp.get('diff_dropoff')        === 'true'
  const dropoffName        = sp.get('dropoff_name')        ?? ''
  const dropoffPlaceId     = sp.get('dropoff_place_id')    ?? ''
  const category           = sp.get('category')           ?? 'car'
  const pickupType         = sp.get('pickup_type')         ?? ''
  const pickupLocationName = sp.get('pickup_location_name') ?? ''
  const deliveryAddress    = sp.get('delivery_address')    ?? ''

  const days   = pickupDate && dropoffDate ? daysBetween(pickupDate, dropoffDate) : 1
  const isBike = category === 'bike_ebike'

  const [rentals,          setRentals]          = useState<CarRental[]>([])
  const [loading,          setLoading]          = useState(true)
  const [activeClass,      setActiveClass]      = useState<string>('all')
  const [sortMode,         setSortMode]         = useState<SortMode>('price')
  const [filterOpen,       setFilterOpen]       = useState(false)
  const [filters,          setFilters]          = useState<FilterState>({ transmission: '', fuel_type: '', seats: '', car_class: '' })
  const [bikeMinPrice,     setBikeMinPrice]     = useState('')
  const [bikeMaxPrice,     setBikeMaxPrice]     = useState('')
  const [bikeHeightFilter, setBikeHeightFilter] = useState('')

  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/rentals/cars?type=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => { setRentals(Array.isArray(data.rentals) ? data.rentals : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category])

  const ATV_CLASSES  = ['atv', 'motorbike', 'scooter', 'buggy']
  const BIKE_CLASSES = ['ebike', 'city_bike', 'mountain_bike']

  const distinctClasses = category === 'atv_motorbike' ? ATV_CLASSES
    : category === 'bike_ebike'   ? BIKE_CLASSES
    : Array.from(new Set(rentals.filter(r => r.car_class).map(r => r.car_class!)))
  const showCarousel = category === 'atv_motorbike' || category === 'bike_ebike' || distinctClasses.length > 1
  const ctaLabel        = CTA_LABELS[category] ?? 'Reserve →'

  function bikeHeightMatch(riderHeight: string | null, filter: string): boolean {
    if (!filter) return true
    if (!riderHeight) return true
    const nums = riderHeight.match(/\d+/g)?.map(Number) ?? []
    if (nums.length === 0) return true
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    if (filter === '190plus') return max >= 190
    const h = parseInt(filter)
    return min <= h && max >= h
  }

  // Filtering
  const filtered = rentals.filter(r => {
    if (activeClass !== 'all' && r.car_class !== activeClass) return false
    if (isBike) {
      if (bikeMinPrice && (r.price_per_day ?? 0) < parseFloat(bikeMinPrice)) return false
      if (bikeMaxPrice && (r.price_per_day ?? 0) > parseFloat(bikeMaxPrice)) return false
      if (bikeHeightFilter && !bikeHeightMatch(r.rider_height ?? null, bikeHeightFilter)) return false
    } else {
      if (sortMode === 'zero_deposit' && !r.zero_deposit) return false
      if (filters.transmission && r.transmission !== filters.transmission) return false
      if (filters.fuel_type && r.fuel_type !== filters.fuel_type) return false
      if (filters.seats && (r.seats ?? 0) < parseInt(filters.seats)) return false
    }
    return true
  }).sort((a, b) => (a.price_per_day ?? 0) - (b.price_per_day ?? 0))

  const zeroDepositCount = rentals.filter(r => r.zero_deposit).length

  function scrollCarousel(dir: 'left' | 'right') {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' })
  }

  function buildParams(rentalId: string) {
    const p = new URLSearchParams(sp.toString())
    p.set('rental_id', rentalId)
    return p.toString()
  }

  const summaryLabel = (() => {
    const datePart = pickupDate && dropoffDate
      ? `${pickupDate.split('-').reverse().join('/')} – ${dropoffDate.split('-').reverse().join('/')}`
      : ''
    const locationPart = pickupType === 'location' ? pickupLocationName
      : pickupType === 'delivery' ? deliveryAddress
      : pickupName
    return [locationPart, datePart].filter(Boolean).join(' · ')
  })()

  function clearFilters() {
    setFilters({ transmission: '', fuel_type: '', seats: '', car_class: '' })
    setActiveClass('all')
    setSortMode('price')
    setBikeMinPrice('')
    setBikeMaxPrice('')
    setBikeHeightFilter('')
  }

  const ChipGroup = ({ options, value, onChange }: {
    options: { label: string; value: string }[]
    value: string
    onChange: (v: string) => void
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            value === o.value
              ? 'bg-navy text-white border-navy'
              : 'bg-white text-tx-mid border-border-light hover:border-navy'
          }`}
        >{o.label}</button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-6">

      {/* Sticky search summary bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-border-light px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push(`/rentals/search?category=${category}&${sp.toString()}`)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-navy font-medium truncate">{summaryLabel || 'Search rentals'}</p>
            {pickupType === 'delivery' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap flex-shrink-0">
                Delivery — extra fees may apply
              </span>
            )}
          </div>
          <p className="text-[11px] text-tx-light">{days} day{days !== 1 ? 's' : ''} · {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</p>
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

      {/* Category carousel — only shown when results have multiple distinct classes */}
      {showCarousel && (
        <div className="relative px-4 pt-4 pb-2">
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-border-light shadow-sm flex items-center justify-center text-navy text-xs"
          >‹</button>

          <div
            ref={carouselRef}
            className="flex gap-2 overflow-x-auto no-scrollbar px-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {/* All card */}
            <button
              onClick={() => setActiveClass('all')}
              style={{ scrollSnapAlign: 'start' }}
              className={`flex-shrink-0 w-[88px] rounded-xl overflow-hidden border-2 transition-all ${
                activeClass === 'all' ? 'border-navy' : 'border-border-light'
              }`}
            >
              <div className="h-[56px] bg-navy flex items-center justify-center">
                <span className="text-white text-xl">🚗</span>
              </div>
              <div className="py-1.5 bg-white text-center">
                <p className={`text-[11px] font-semibold ${activeClass === 'all' ? 'text-teal' : 'text-navy'}`}>All</p>
              </div>
            </button>

            {distinctClasses.map(cls => (
              <button
                key={cls}
                onClick={() => setActiveClass(activeClass === cls ? 'all' : cls)}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex-shrink-0 w-[88px] rounded-xl overflow-hidden border-2 transition-all ${
                  activeClass === cls ? 'border-navy' : 'border-border-light'
                }`}
              >
                <div
                  className="h-[56px] flex items-center justify-center"
                  style={{ background: CAR_CLASS_GRADIENTS[cls] ?? '#1B2D4F' }}
                />
                <div className="py-1.5 bg-white text-center px-1">
                  <p className={`text-[10px] font-semibold leading-tight ${activeClass === cls ? 'text-teal' : 'text-navy'}`}>
                    {vehicleClassLabel(cls)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-border-light shadow-sm flex items-center justify-center text-navy text-xs"
          >›</button>
        </div>
      )}

      {/* Sort strip — cars only */}
      {category === 'car' && <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSortMode('price')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            sortMode === 'price' ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border-light'
          }`}
        >
          <span>💶</span>
          <span>Lowest Price</span>
          <span className={`text-[10px] ${sortMode === 'price' ? 'text-white/70' : 'text-tx-light'}`}>({filtered.length})</span>
        </button>
        <button
          onClick={() => setSortMode(sortMode === 'zero_deposit' ? 'price' : 'zero_deposit')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            sortMode === 'zero_deposit' ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border-light'
          }`}
        >
          <span>🛡</span>
          <span>Zero Deposit</span>
          <span className={`text-[10px] ${sortMode === 'zero_deposit' ? 'text-white/70' : 'text-tx-light'}`}>({zeroDepositCount})</span>
        </button>
      </div>}

      {/* Vehicle list */}
      {isBike ? (
        /* ── Bike: 2-column compact grid ── */
        <div className="grid grid-cols-2 gap-3 px-3">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border-light overflow-hidden">
              <div className="aspect-[3/2] bg-navy/5 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-navy/5 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-navy/5 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-tx-light text-sm">
              <p className="text-2xl mb-3">🚲</p>
              <p className="font-medium text-navy">No bikes match your filters</p>
              <button onClick={clearFilters} className="mt-3 text-teal text-sm font-semibold">Clear filters</button>
            </div>
          )}

          {!loading && filtered.map(rental => {
            const heroSrc = rental.image_wide ?? rental.images?.[0] ?? null
            const features = (rental.features ?? {}) as Record<string, boolean>

            return (
              <button
                key={rental.id}
                onClick={() => router.push(`/rentals/bikes/${rental.id}?${buildParams(rental.id)}`)}
                className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
              >
                {/* Photo — 3:2 */}
                {heroSrc ? (
                  <FocalImage
                    src={heroSrc}
                    alt={rental.name}
                    className="w-full aspect-[3/2] object-cover"
                    focalPoint={rental.focal_x != null && rental.focal_y != null ? { x: rental.focal_x, y: rental.focal_y } : null}
                  />
                ) : (
                  <div className="w-full aspect-[3/2] flex items-center justify-center bg-teal/10">
                    <span className="text-3xl">🚲</span>
                  </div>
                )}

                <div className="p-3">
                  {rental.car_class && (
                    <p className="text-[11px] text-gray-400 mb-0.5">{vehicleClassLabel(rental.car_class)}</p>
                  )}
                  {rental.delivery_area && (
                    <p className="text-[11px] text-gray-400 mb-0.5">📍 {rental.delivery_area}</p>
                  )}
                  <p className="font-semibold text-navy text-[13px] leading-snug line-clamp-2 mb-1">{rental.name}</p>

                  <div className="space-y-0.5 mb-2">
                    {rental.motor_power && <p className="text-[11px] text-gray-400">⚡ {rental.motor_power}</p>}
                    {rental.autonomy    && <p className="text-[11px] text-gray-400">🔋 {rental.autonomy}</p>}
                    {!rental.motor_power && rental.gears && <p className="text-[11px] text-gray-400">⚙️ {rental.gears}</p>}
                    {rental.rider_height && <p className="text-[11px] text-gray-400">👤 {rental.rider_height}</p>}
                  </div>

                  <p className="font-semibold text-navy text-[13px]">€{rental.price_per_day}/day</p>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {features.free_cancellation && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal/10 text-teal font-semibold">✓ Free Cancel</span>
                    )}
                    {rental.availability_note && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal/10 text-teal font-semibold">{rental.availability_note}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* ── Cars / ATVs: standard single-column list ── */
        <div className="px-4 space-y-4">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border-light overflow-hidden">
              <div className="h-[180px] bg-navy/5 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-navy/5 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-navy/5 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-tx-light text-sm">
              <p className="text-2xl mb-3">🚗</p>
              <p className="font-medium text-navy">
                {activeClass !== 'all' ? 'No vehicles in this category yet.' : 'No vehicles match your filters'}
              </p>
              {activeClass === 'all' && <button onClick={clearFilters} className="mt-3 text-teal text-sm font-semibold">Clear filters</button>}
            </div>
          )}

          {!loading && filtered.map(rental => {
            const heroSrc = rental.image_wide ?? rental.images?.[0] ?? null
            const totalPrice = (rental.price_per_day ?? 0) * days
            const features = (rental.features ?? {}) as Record<string, boolean>
            const activeFeatures = Object.entries(features).filter(([, v]) => v)

            return (
              <div key={rental.id} className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
                <div className="relative">
                  {heroSrc ? (
                    <FocalImage
                      src={heroSrc}
                      alt={rental.name}
                      className="w-full aspect-video object-cover"
                      focalPoint={rental.focal_x != null && rental.focal_y != null ? { x: rental.focal_x, y: rental.focal_y } : null}
                    />
                  ) : (
                    <div
                      className="w-full aspect-video flex items-center justify-center"
                      style={{ background: CAR_CLASS_GRADIENTS[rental.car_class ?? ''] ?? '#1B2D4F' }}
                    >
                      <span className="text-4xl">🚗</span>
                    </div>
                  )}
                  {rental.car_class && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/90 text-navy">
                      {vehicleClassLabel(rental.car_class)}
                    </span>
                  )}
                  {rental.zero_deposit && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal text-white">
                      Zero Deposit
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-lg text-navy leading-tight">{rental.name}</h3>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-navy">€{totalPrice.toFixed(0)}</p>
                      <p className="text-[11px] text-tx-light">€{rental.price_per_day}/day</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {rental.seats        && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">🪑 {rental.seats} seats</span>}
                    {rental.doors        && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">🚪 {rental.doors} doors</span>}
                    {rental.transmission && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">⚙️ {rental.transmission}</span>}
                    {rental.fuel_type    && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">⛽ {rental.fuel_type}</span>}
                    {rental.ac           && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">❄️ A/C</span>}
                  </div>

                  {activeFeatures.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {activeFeatures.map(([key]) => (
                        <p key={key} className="text-[11px] text-teal flex items-center gap-1.5">
                          <span className="text-teal">✓</span>
                          {FEATURE_LABELS[key] ?? key}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/rentals/cars/${rental.id}/driver?${buildParams(rental.id)}`)}
                    className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform"
                  >
                    {ctaLabel}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

            {isBike ? (
              <div className="space-y-5">
                {distinctClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Vehicle Type</p>
                    <ChipGroup
                      value={activeClass === 'all' ? '' : activeClass}
                      onChange={v => setActiveClass(v || 'all')}
                      options={[
                        { label: 'All', value: '' },
                        ...distinctClasses.map(c => ({ label: vehicleClassLabel(c), value: c })),
                      ]}
                    />
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Price per Day</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                      <span className="text-tx-light text-sm flex-shrink-0">Min €</span>
                      <input
                        type="number"
                        value={bikeMinPrice}
                        onChange={e => setBikeMinPrice(e.target.value)}
                        placeholder="0"
                        className="flex-1 text-sm text-navy outline-none w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-border-light rounded-xl">
                      <span className="text-tx-light text-sm flex-shrink-0">Max €</span>
                      <input
                        type="number"
                        value={bikeMaxPrice}
                        onChange={e => setBikeMaxPrice(e.target.value)}
                        placeholder="any"
                        className="flex-1 text-sm text-navy outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Rider Height</p>
                  <ChipGroup
                    value={bikeHeightFilter}
                    onChange={v => setBikeHeightFilter(v)}
                    options={[
                      { label: 'All', value: '' },
                      { label: 'Up to 170cm', value: '170' },
                      { label: 'Up to 180cm', value: '180' },
                      { label: 'Up to 190cm', value: '190' },
                      { label: '190cm+', value: '190plus' },
                    ]}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Sort by</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSortMode('price')}
                      className={`py-2 rounded-xl border text-sm font-semibold transition-colors ${sortMode === 'price' ? 'bg-navy text-white border-navy' : 'border-border-light text-tx-mid'}`}>
                      💶 Lowest Price
                    </button>
                    <button onClick={() => setSortMode('zero_deposit')}
                      className={`py-2 rounded-xl border text-sm font-semibold transition-colors ${sortMode === 'zero_deposit' ? 'bg-navy text-white border-navy' : 'border-border-light text-tx-mid'}`}>
                      🛡 Zero Deposit
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Transmission</p>
                  <ChipGroup
                    value={filters.transmission}
                    onChange={v => setFilters(f => ({ ...f, transmission: v }))}
                    options={[
                      { label: 'All', value: '' },
                      { label: 'Manual', value: 'manual' },
                      { label: 'Automatic', value: 'automatic' },
                    ]}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Fuel Type</p>
                  <ChipGroup
                    value={filters.fuel_type}
                    onChange={v => setFilters(f => ({ ...f, fuel_type: v }))}
                    options={[
                      { label: 'All', value: '' },
                      { label: 'Petrol', value: 'petrol' },
                      { label: 'Diesel', value: 'diesel' },
                      { label: 'Electric', value: 'electric' },
                      { label: 'Hybrid', value: 'hybrid' },
                    ]}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Seats</p>
                  <ChipGroup
                    value={filters.seats}
                    onChange={v => setFilters(f => ({ ...f, seats: v }))}
                    options={[
                      { label: 'All', value: '' },
                      { label: '2+', value: '2' },
                      { label: '4+', value: '4' },
                      { label: '5+', value: '5' },
                      { label: '7+', value: '7' },
                    ]}
                  />
                </div>

                {distinctClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Vehicle Class</p>
                    <ChipGroup
                      value={activeClass === 'all' ? '' : activeClass}
                      onChange={v => setActiveClass(v || 'all')}
                      options={[
                        { label: 'All', value: '' },
                        ...distinctClasses.map(c => ({ label: vehicleClassLabel(c), value: c })),
                      ]}
                    />
                  </div>
                )}
              </div>
            )}

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

export default function CarsResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center text-tx-light text-sm">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  )
}
