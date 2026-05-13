'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '@/lib/utils'
import type { Service } from '@/lib/types'

const SPYROS_WA = '306974176759'

const SUBCATEGORY_LABELS: Record<string, string> = {
  wellness_health:        'Wellness & Health',
  family_care:            'Family & Care',
  food_dining:            'Food & Dining',
  villa_lifestyle:        'Villa & Lifestyle',
  private_experiences:    'Private Experiences',
  beach_dining_nightlife: 'Beach, Dining & Nightlife',
  lifestyle_shopping:     'Lifestyle & Shopping',
  events_access:          'Events & Access',
}

const TIME_OPTIONS = [
  { value: 'morning',   label: 'Morning (8:00 – 12:00)' },
  { value: 'afternoon', label: 'Afternoon (12:00 – 17:00)' },
  { value: 'evening',   label: 'Evening (17:00 – 21:00)' },
  { value: 'flexible',  label: 'Flexible' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function ImageCarousel({ images, title, onBack }: { images: string[]; title: string; onBack: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="h-[240px] relative flex-shrink-0 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((url, i) => (
          <div key={url} className="flex-shrink-0 w-full h-full snap-start relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
          </div>
        ))}
      </div>
      <button
        onClick={onBack}
        className="absolute top-[52px] left-4 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 px-3 h-[34px] text-[12px] font-semibold text-navy z-10 active:scale-90"
      >
        ← Services
      </button>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all ${i === activeIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EnquiryModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const session = getSession()

  const [preferredDate, setPreferredDate] = useState(session?.check_in ?? todayStr())
  const [preferredTime, setPreferredTime] = useState('flexible')
  const [numGuests,     setNumGuests]     = useState(2)
  const [notes,         setNotes]         = useState('')
  const [guestName,     setGuestName]     = useState(session?.first_name ?? '')
  const [guestEmail,    setGuestEmail]    = useState('')
  const [guestPhone,    setGuestPhone]    = useState(session?.whatsapp_number ?? '')
  const [submitting,    setSubmitting]    = useState(false)
  const [emailSent,     setEmailSent]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function submit(via: 'whatsapp' | 'email') {
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:     service.id,
          service_title:  service.title,
          subcategory:    service.subcategory,
          guest_name:     guestName || session?.first_name || 'Guest',
          guest_email:    guestEmail || null,
          guest_phone:    guestPhone || session?.whatsapp_number || null,
          preferred_date: preferredDate,
          preferred_time: TIME_OPTIONS.find(t => t.value === preferredTime)?.label ?? preferredTime,
          num_guests:     String(numGuests),
          notes:          notes || null,
          property_name:  session?.property_name || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      if (via === 'whatsapp') {
        window.open(`https://wa.me/${SPYROS_WA}?text=${encodeURIComponent(data.whatsapp_message)}`, '_blank')
        onClose()
      } else {
        setEmailSent(true)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {emailSent ? (
          <div className="px-5 py-8 text-center">
            <p className="text-3xl mb-3">✅</p>
            <h3 className="font-display text-lg text-navy mb-1">Enquiry Sent</h3>
            <p className="text-sm text-tx-light mb-1">We&apos;ll confirm availability via WhatsApp shortly.</p>
            <p className="text-xs text-tx-light">Check your email for a copy.</p>
            <button onClick={onClose} className="mt-6 w-full py-3 bg-navy text-white font-semibold rounded-sm text-sm">Done</button>
          </div>
        ) : (
          <div className="px-5 pb-8">
            <h3 className="font-display text-lg text-navy mt-2 mb-4">Enquire — {service.title}</h3>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Preferred Date *</label>
              <input type="date" min={todayStr()} value={preferredDate} onChange={e => setPreferredDate(e.target.value)} className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-navy bg-white" />
            </div>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Preferred Time</label>
              <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-navy bg-white">
                {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Number of Guests</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setNumGuests(g => Math.max(1, g - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-navy font-bold text-lg active:bg-sand">−</button>
                <span className="text-base font-semibold text-navy w-6 text-center">{numGuests}</span>
                <button onClick={() => setNumGuests(g => Math.min(20, g + 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-navy font-bold text-lg active:bg-sand">+</button>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Special Requests (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests or details?" rows={3} className="w-full border border-border rounded-sm px-3 py-2 text-sm text-navy bg-white resize-none" />
            </div>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Your Name *</label>
              <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="First name" className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-navy bg-white" />
            </div>
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Email *</label>
              <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="your@email.com" className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-navy bg-white" />
            </div>
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-tx-mid uppercase tracking-wide block mb-1">Phone / WhatsApp *</label>
              <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+30 69..." className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-navy bg-white" />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button onClick={() => submit('whatsapp')} disabled={submitting} className="w-full py-3.5 bg-teal text-white font-bold rounded-sm flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform mb-2 disabled:opacity-60">
              💬 Enquire via WhatsApp →
            </button>
            <button onClick={() => submit('email')} disabled={submitting || !guestEmail} className="w-full py-3.5 bg-white text-navy font-semibold rounded-sm border border-border text-sm active:scale-[0.98] transition-transform disabled:opacity-40">
              Send Enquiry by Email
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  // This page handles /services/[slug] — the param is named 'category' due to Next.js
  // segment name unification, but the value is the service slug.
  const slug = params?.category as string

  const [service,     setService]     = useState<Service | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/services/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true)
        else setService(d.service)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  const handleBack = () => window.history.length <= 1 ? router.push('/services') : router.back()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="h-[240px] bg-navy/5 animate-pulse flex-shrink-0" />
        <div className="px-5 pt-4 space-y-3">
          <div className="h-7 bg-navy/5 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-navy/5 rounded animate-pulse w-1/2" />
          <div className="h-24 bg-navy/5 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-4">🛎️</p>
        <h1 className="font-display text-xl text-navy mb-2">Service not found</h1>
        <p className="text-sm text-tx-light mb-6">This service may no longer be available.</p>
        <button onClick={handleBack} className="text-sm font-semibold text-teal">← Back to services</button>
      </div>
    )
  }

  const images = [
    ...(service.image_wide ? [service.image_wide] : []),
    ...(service.images ?? []).filter(u => u !== service.image_wide),
  ].filter((u): u is string => !!u)
  const hasImages = images.length > 0

  return (
    <div className="min-h-screen bg-cream flex flex-col relative">
      {hasImages ? (
        <ImageCarousel images={images} title={service.title} onBack={handleBack} />
      ) : (
        <div className="h-[240px] relative flex items-end p-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(27,45,79,0.12), rgba(26,138,125,0.08))' }}>
          <button onClick={handleBack} className="absolute top-[52px] left-4 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 px-3 h-[34px] text-[12px] font-semibold text-navy z-10 active:scale-90">← Services</button>
          <span className="text-5xl">🛎️</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-[100px]">
        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {service.subcategory && (
              <span className="text-[10px] font-bold uppercase text-teal tracking-wide border border-teal/30 rounded-full px-2 py-0.5">
                {SUBCATEGORY_LABELS[service.subcategory] ?? service.subcategory}
              </span>
            )}
            {service.service_type && (
              <span className="text-[10px] font-semibold text-navy border border-navy/20 rounded-full px-2 py-0.5">
                {service.service_type}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl text-navy leading-tight mb-2">{service.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {service.is_on_offer && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-terra text-white">Special Offer</span>
            )}
            {service.is_on_offer && service.offer_price ? (
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-terra">from €{service.offer_price}</span>
                <span className="text-sm text-tx-light line-through">{service.price_label ?? (service.price_from ? `€${service.price_from}` : '')}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-terra">
                {service.price_label ?? (service.price_from ? `from €${service.price_from}` : 'Price on request')}
              </span>
            )}
            {service.duration && (
              <span className="text-xs text-tx-mid bg-sand border border-border-light rounded-full px-2.5 py-0.5">⏱ {service.duration}</span>
            )}
          </div>
          {service.is_on_offer && service.offer_label && (
            <p className="text-sm text-terra/80 -mt-2 mb-3">{service.offer_label}</p>
          )}

          {service.description && (
            <p className="text-sm text-tx-mid leading-relaxed mb-5">{service.description}</p>
          )}

          {service.includes && service.includes.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-navy mb-2">What&apos;s included</h2>
              <ul className="space-y-1.5">
                {service.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-tx-mid">
                    <span className="text-teal flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.good_to_know && (
            <div className="mb-5 p-3.5 rounded-sm bg-sand border border-border-light">
              <h2 className="text-sm font-semibold text-navy mb-1.5">ℹ Good to know</h2>
              <p className="text-xs text-tx-mid leading-relaxed">{service.good_to_know}</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream border-t border-border-light" style={{ zIndex: 30 }}>
        <button onClick={() => setShowEnquiry(true)} className="w-full py-3.5 bg-navy text-white font-bold rounded-sm text-sm active:scale-[0.98] transition-transform">
          Enquire About This Service →
        </button>
      </div>

      {showEnquiry && <EnquiryModal service={service} onClose={() => setShowEnquiry(false)} />}
    </div>
  )
}
