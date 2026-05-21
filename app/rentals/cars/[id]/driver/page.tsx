'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import type { CarRental, CarRentalExtra } from '@/lib/types'

const COUNTRIES = [
  'Germany', 'United Kingdom', 'France', 'Netherlands', 'Italy',
  'Austria', 'Switzerland', 'Poland', 'USA', 'Greece', 'Other',
]

const INPUT  = 'w-full px-3 py-2.5 border border-border-light rounded-xl text-sm text-navy bg-white outline-none focus:border-navy/40 transition-colors'
const LABEL  = 'block text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1.5'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime()
  const d2 = new Date(b).getTime()
  return Math.max(1, Math.round((d2 - d1) / 86400000))
}

type DriverForm = {
  first_name:    string
  last_name:     string
  email:         string
  country:       string
  phone:         string
  flight_number: string
  driver_age:    string
}

function DriverContent() {
  const router = useRouter()
  const params = useParams()
  const sp     = useSearchParams()
  const id     = params.id as string

  const pickupDate         = sp.get('pickup_date')          ?? ''
  const dropoffDate        = sp.get('dropoff_date')         ?? ''
  const pickupTime         = sp.get('pickup_time')          ?? ''
  const dropoffTime        = sp.get('dropoff_time')         ?? ''
  const pickupName         = sp.get('pickup_name')          ?? ''
  const pickupType         = sp.get('pickup_type')          ?? ''
  const pickupLocationName = sp.get('pickup_location_name') ?? ''
  const deliveryAddress    = sp.get('delivery_address')     ?? ''
  const days = pickupDate && dropoffDate ? daysBetween(pickupDate, dropoffDate) : 1

  const [vehicle, setVehicle]   = useState<CarRental | null>(null)
  const [extras,  setExtras]    = useState<CarRentalExtra[]>([])
  const [loading, setLoading]   = useState(true)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set())

  const [form, setForm] = useState<DriverForm>({
    first_name: '', last_name: '', email: '', country: '',
    phone: '', flight_number: '', driver_age: '',
  })
  const [errors, setErrors] = useState<Partial<DriverForm>>({})

  useEffect(() => {
    fetch(`/api/rentals/cars?id=${id}`)
      .then(r => r.json())
      .then(async (vData) => {
        const v = vData.rental ?? null
        setVehicle(v)
        if (v?.type === 'car') {
          const eData = await fetch('/api/rentals/car-extras').then(r => r.json())
          setExtras(Array.isArray(eData.extras) ? eData.extras : [])
        } else if (v?.type === 'atv_motorbike') {
          const eData = await fetch('/api/rentals/atv-extras').then(r => r.json())
          const mapped: CarRentalExtra[] = (Array.isArray(eData.extras) ? eData.extras : []).map((e: any) => ({
            id: e.id, name: e.name, description: e.description ?? null,
            price: e.price ?? 0, price_type: 'per_rental' as const,
            is_insurance: false, insurance_description: null,
            is_free: false, is_active: e.is_active, sort_order: e.sort_order,
            created_at: e.created_at ?? '',
          }))
          setExtras(mapped)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  function setField(k: keyof DriverForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  function toggleExtra(extraId: string) {
    setSelectedExtras(prev => {
      const next = new Set(prev)
      next.has(extraId) ? next.delete(extraId) : next.add(extraId)
      return next
    })
  }

  function validate(): boolean {
    const errs: Partial<DriverForm> = {}
    if (!form.first_name.trim()) errs.first_name = 'Required'
    if (!form.last_name.trim())  errs.last_name  = 'Required'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid email required'
    if (!form.country)           errs.country    = 'Required'
    if (!form.phone.trim())      errs.phone      = 'Required'
    if (!form.driver_age || Number(form.driver_age) < 18) errs.driver_age = 'Must be 18 or older'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Price calculation
  const baseTotal = (vehicle?.price_per_day ?? 0) * days
  const extrasTotal = extras.filter(e => selectedExtras.has(e.id)).reduce((sum, e) => {
    if (e.is_free) return sum
    return sum + (e.price_type === 'per_day' ? e.price * days : e.price)
  }, 0)
  const grandTotal = baseTotal + extrasTotal

  function handleContinue() {
    if (!validate() || !vehicle) return
    const selectedExtrasList = extras
      .filter(e => selectedExtras.has(e.id))
      .map(e => ({ name: e.name, price: e.is_free ? 0 : (e.price_type === 'per_day' ? e.price * days : e.price), price_type: e.price_type }))

    const pickupDisplayName = pickupType === 'location' ? pickupLocationName
      : pickupType === 'delivery' ? deliveryAddress
      : pickupName

    const enquiryState = {
      vehicle_id:       id,
      vehicle_name:     vehicle.name,
      car_class:        vehicle.car_class ?? '',
      vehicle:          vehicle,
      pickup_type:      pickupType || 'location',
      pickup_location:  pickupDisplayName,
      pickup_location_name: pickupLocationName || undefined,
      delivery_address: deliveryAddress || undefined,
      pickup_place_id:  sp.get('pickup_place_id') ?? '',
      diff_dropoff:     sp.get('diff_dropoff') === 'true',
      dropoff_location: sp.get('dropoff_name') ?? undefined,
      dropoff_place_id: sp.get('dropoff_place_id') ?? undefined,
      pickup_date:      pickupDate,
      dropoff_date:     dropoffDate,
      pickup_time:      pickupTime,
      dropoff_time:     dropoffTime,
      duration_days:    days,
      driver_first_name: form.first_name,
      driver_last_name:  form.last_name,
      driver_email:      form.email,
      driver_phone:      form.phone,
      driver_country:    form.country,
      driver_age:        Number(form.driver_age),
      flight_number:     form.flight_number || undefined,
      selected_extras:   selectedExtrasList,
      extras_total:      extrasTotal,
      grand_total:       grandTotal,
    }
    sessionStorage.setItem('rental_enquiry', JSON.stringify(enquiryState))
    router.push(`/rentals/cars/${id}/confirm?${sp.toString()}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-tx-light text-sm">Loading…</p>
    </div>
  )

  if (!vehicle) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
      <p className="text-tx-light text-sm">Vehicle not found.</p>
      <button onClick={() => router.back()} className="text-teal text-sm font-semibold">← Go back</button>
    </div>
  )

  const isAtv = vehicle.type === 'atv_motorbike'
  const features = vehicle?.features ?? null
  const standardExtras = extras.filter(e => {
    if (e.is_insurance) return false
    if (features?.free_driver && e.name === 'Additional Driver') return false
    return true
  })
  const insuranceExtra = isAtv ? undefined : extras.find(e => e.is_insurance)

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[140px]">
      {/* Sticky mini-header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border-light px-4 py-3 shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-2">
          <span className="text-tx-light text-sm">←</span>
          <div>
            <p className="text-sm font-semibold text-navy leading-tight">{vehicle.name}</p>
            <p className="text-[11px] text-tx-light">€{vehicle.price_per_day}/day · {days} day{days !== 1 ? 's' : ''}</p>
          </div>
        </button>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Driver details */}
        <div className="bg-white rounded-2xl border border-border-light p-5 space-y-4 shadow-sm">
          <h2 className="font-display text-lg text-navy">Driver Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>First Name *</label>
              <input className={`${INPUT} ${errors.first_name ? 'border-red-300' : ''}`}
                value={form.first_name} onChange={e => setField('first_name', e.target.value)}
                placeholder="Maria" />
              {errors.first_name && <p className="text-[11px] text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className={LABEL}>Last Name *</label>
              <input className={`${INPUT} ${errors.last_name ? 'border-red-300' : ''}`}
                value={form.last_name} onChange={e => setField('last_name', e.target.value)}
                placeholder="Schmidt" />
              {errors.last_name && <p className="text-[11px] text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL}>Email Address *</label>
            <input type="email" className={`${INPUT} ${errors.email ? 'border-red-300' : ''}`}
              value={form.email} onChange={e => setField('email', e.target.value)}
              placeholder="maria@example.com" />
            {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className={LABEL}>Country *</label>
            <select className={`${INPUT} ${errors.country ? 'border-red-300' : ''}`}
              value={form.country} onChange={e => setField('country', e.target.value)}>
              <option value="">Select country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <p className="text-[11px] text-red-500 mt-1">{errors.country}</p>}
          </div>

          <div>
            <label className={LABEL}>Phone Number *</label>
            <input type="tel" className={`${INPUT} ${errors.phone ? 'border-red-300' : ''}`}
              value={form.phone} onChange={e => setField('phone', e.target.value)}
              placeholder="+44 7700 000000" />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className={LABEL}>Flight Number <span className="font-normal normal-case text-tx-light">(optional)</span></label>
            <input className={INPUT}
              value={form.flight_number} onChange={e => setField('flight_number', e.target.value)}
              placeholder="e.g. EasyJet U28443" />
          </div>

          <div>
            <label className={LABEL}>Driver Age *</label>
            <input type="number" min={18} max={99} className={`${INPUT} ${errors.driver_age ? 'border-red-300' : ''}`}
              value={form.driver_age} onChange={e => setField('driver_age', e.target.value)}
              placeholder="25" />
            {errors.driver_age && <p className="text-[11px] text-red-500 mt-1">{errors.driver_age}</p>}
            <p className="text-[11px] text-tx-light mt-1">Minimum age requirements vary by vehicle class</p>
          </div>
        </div>

        {/* Extras */}
        {(standardExtras.length > 0 || insuranceExtra) && (
          <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
            <h2 className="font-display text-lg text-navy mb-1">Personalise Your Ride</h2>
            <p className="text-sm text-tx-light mb-4">Enhance your journey with these optional extras.</p>

            <div className="space-y-3">
              {standardExtras.map(extra => (
                <div key={extra.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{extra.name}</p>
                    <p className={`text-[11px] ${extra.is_free ? 'text-teal font-semibold' : 'text-tx-light'}`}>
                      {extra.is_free ? 'Free' : (extra.price_type === 'per_day'
                        ? `€${extra.price}/day (€${(extra.price * days).toFixed(2)} total)`
                        : `€${extra.price}/rental`)}
                    </p>
                  </div>
                  <Toggle checked={selectedExtras.has(extra.id)} onChange={() => toggleExtra(extra.id)} />
                </div>
              ))}
            </div>

            {insuranceExtra && (
              <>
                <div className="border-t border-border-light my-4" />
                <div>
                  <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1">Upgrade your insurance plan</p>
                  <p className="text-[11px] text-tx-light mb-3">Optional — standard insurance is included</p>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-teal text-base">🛡</span>
                        <p className="text-sm font-semibold text-navy">{insuranceExtra.name}</p>
                      </div>
                      {insuranceExtra.insurance_description && (
                        <p className="text-[11px] text-tx-light leading-relaxed mb-1">{insuranceExtra.insurance_description}</p>
                      )}
                      <p className="text-[11px] text-tx-mid font-semibold">€{insuranceExtra.price}/rental</p>
                    </div>
                    <Toggle checked={selectedExtras.has(insuranceExtra.id)} onChange={() => toggleExtra(insuranceExtra.id)} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky price summary bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border-light px-4 py-4 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] text-tx-light">{days} days × €{vehicle.price_per_day}/day</p>
            {extrasTotal > 0 && <p className="text-[11px] text-tx-light">+ €{extrasTotal.toFixed(2)} extras</p>}
            <p className="text-base font-bold text-navy mt-0.5">Total estimate: €{grandTotal.toFixed(2)}</p>
            <p className="text-[10px] text-tx-light">Final price confirmed on enquiry</p>
          </div>
        </div>
        <button
          onClick={handleContinue}
          className="w-full py-3 bg-navy text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default function DriverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <DriverContent />
    </Suspense>
  )
}
