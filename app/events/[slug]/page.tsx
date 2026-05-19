'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { getSession } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { EventFull } from '@/lib/types'

const SPYROS_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '306974176759'

const CATEGORY_COLORS: Record<string, string> = {
  festival: '#D4854A', music: '#1B2D4F', food: '#D4A843', sport: '#1A8A7D',
  cultural: '#9B59B6', market: '#1A8A7D', nightlife: '#D94F4F', family: '#3498DB', other: '#5A5A5A',
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const [event, setEvent] = useState<EventFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalEmail, setModalEmail] = useState('')
  const [modalNotes, setModalNotes] = useState('')

  useEffect(() => {
    if (!slug) return
    const supabase = createClient()
    supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setEvent(data ?? null)
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    const s = getSession()
    if (s?.first_name) setModalName(s.first_name)
  }, [])

  function sendEnquiry() {
    if (!event) return
    const session = getSession()
    const name = modalName.trim() || session?.first_name || 'Guest'
    const property = session?.property_name || '—'
    const dateLabel = new Date(event.start_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const parts = [
      `🌟 Event Enquiry — Island Key`,
      `📅 Event: ${event.title}`,
      `📆 Date: ${dateLabel}`,
      `👤 Guest: ${name}`,
      modalEmail.trim() ? `📧 Email: ${modalEmail.trim()}` : null,
      `🏠 Property: ${property}`,
      modalNotes.trim() ? `📝 Notes: ${modalNotes.trim()}` : null,
    ].filter(Boolean)
    window.open(`https://wa.me/${SPYROS_WA}?text=${encodeURIComponent(parts.join('\n'))}`, '_blank')
    setShowModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
        <div className="h-[250px] bg-navy/10 animate-pulse" />
        <div className="px-5 py-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 bg-navy/5 rounded animate-pulse w-3/4" />)}
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center pb-[90px]">
        <p className="text-tx-light text-sm">Event not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-teal text-sm font-semibold">← Go back</button>
        <BottomNav />
      </div>
    )
  }

  const images = event.images ?? []
  const evCats = event.categories?.length ? event.categories : event.category ? [event.category] : []
  const catColor = CATEGORY_COLORS[evCats[0] ?? 'other'] ?? '#5A5A5A'
  const startDate = new Date(event.start_date)
  const dateLabel = startDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeLabel = event.all_day ? 'All day' : startDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Hero image(s) */}
      {images.length > 0 ? (
        <div className="relative">
          <div className="overflow-x-auto flex snap-x snap-mandatory no-scrollbar"
            onScroll={e => {
              const el = e.currentTarget
              setImgIndex(Math.round(el.scrollLeft / el.clientWidth))
            }}>
            {images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={event.title} className="min-w-full object-cover snap-start flex-shrink-0"
                style={{
                  aspectRatio: '16/9',
                  ...(i === 0 && event.focal_x != null && event.focal_y != null
                    ? { objectPosition: `${Math.round(event.focal_x * 100)}% ${Math.round(event.focal_y * 100)}%` }
                    : {}),
                }} />
            ))}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full relative flex items-end" style={{ aspectRatio: '16/9', background: `linear-gradient(160deg, ${catColor}dd, #1B2D4F)` }}>
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            {evCats[0] && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white/90 w-fit mb-2"
                style={{ background: 'rgba(255,255,255,0.15)' }}>{evCats[0]}</span>
            )}
            <h2 className="font-display text-xl text-white leading-snug drop-shadow">{event.title}</h2>
          </div>
        </div>
      )}

      <div className="px-5 py-5 space-y-4">
        {/* Back button */}
        <button
          onClick={() => window.history.length <= 1 ? router.push('/events') : router.back()}
          className="text-[12px] font-semibold text-teal"
        >← Events</button>

        {/* Category + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {evCats.map(c => (
            <span key={c} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
              style={{ background: CATEGORY_COLORS[c] ?? '#5A5A5A' }}>{c}</span>
          ))}
          <span className="text-xs text-tx-light">{dateLabel}</span>
          <span className="text-xs text-tx-light">· {timeLabel}</span>
        </div>

        <h1 className="font-display text-2xl text-navy">{event.title}</h1>

        {event.organiser && (
          <p className="text-xs text-tx-light">Organised by {event.organiser}</p>
        )}

        {event.description && (
          <p className="text-sm text-tx-mid leading-relaxed">{event.description}</p>
        )}

        {/* Practical info */}
        <div className="bg-white border border-border-light rounded-sm p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-tx-mid uppercase tracking-wide">Practical Info</h3>
          <div className="text-sm text-tx-mid space-y-1.5">
            <p>📅 {dateLabel}</p>
            <p>🕐 {timeLabel}</p>
            {event.location_name && <p>📍 {event.location_name}</p>}
            {event.location_address && <p className="text-xs text-tx-light ml-5">{event.location_address}</p>}
            {event.is_free ? (
              <p>🎟️ <span className="text-teal font-semibold">Free entry</span></p>
            ) : event.price_label ? (
              <p>🎟️ {event.price_label}</p>
            ) : null}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          {event.booking_url && (
            <a href={event.booking_url} target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 bg-navy text-white font-bold rounded-sm text-center text-sm">
              Get Tickets ↗
            </a>
          )}
          <button onClick={() => setShowModal(true)}
            className="w-full py-3.5 bg-teal text-white font-bold rounded-sm text-sm">
            Check Availability
          </button>
        </div>
      </div>

      <BottomNav />

      {/* Enquiry modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/35 z-[150] flex items-end"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-t-[18px] px-5 pt-5 pb-9 max-h-[85%] overflow-y-auto">
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-lg font-medium text-navy mb-1">Check Availability</h2>
            <p className="text-xs text-tx-light mb-4">We&apos;ll send your request to your Island Key curator via WhatsApp — they&apos;ll confirm within a few hours.</p>
            <div className="flex justify-between items-start py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Event</span>
              <span className="text-[13px] font-semibold text-navy text-right max-w-[60%]">{event.title}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Your name</span>
              <input type="text" value={modalName} onChange={e => setModalName(e.target.value)}
                placeholder="First name"
                className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-36" />
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Email</span>
              <input type="email" value={modalEmail} onChange={e => setModalEmail(e.target.value)}
                placeholder="your@email.com"
                className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-48" />
            </div>
            <div className="py-2.5 border-b border-border-light">
              <p className="text-[13px] text-tx-mid mb-2">Anything to add?</p>
              <textarea value={modalNotes} onChange={e => setModalNotes(e.target.value)}
                placeholder="Number of people, special requirements…"
                rows={3}
                className="w-full text-[13px] text-navy bg-sand rounded px-3 py-2 outline-none resize-none placeholder:text-tx-light" />
            </div>
            <div className="mt-4">
              <button onClick={sendEnquiry}
                className="w-full py-3.5 bg-teal text-white rounded-sm font-semibold text-sm active:scale-[0.98]">
                Check Availability
              </button>
            </div>
            <p className="text-center text-[10px] text-tx-light mt-3">
              No payment taken now — your curator will confirm availability first.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
