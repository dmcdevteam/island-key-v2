'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { getSession } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { EventFull } from '@/lib/types'

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

  function askWhatsApp() {
    const session = getSession()
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '306900000000'
    const name = session?.first_name ?? 'a guest'
    const prop = session?.property_name ?? 'the property'
    const msg = `Hi, I'd like to know more about "${event?.title}". My name is ${name} staying at ${prop}.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
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
  const catColor = CATEGORY_COLORS[event.category ?? 'other'] ?? '#5A5A5A'
  const startDate = new Date(event.start_date)
  const dateLabel = startDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeLabel = event.all_day ? 'All day' : startDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Back button */}
      <button onClick={() => router.back()}
        className="fixed top-0 left-0 z-30 mt-[52px] ml-4 text-white text-sm font-semibold bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
        ← Back
      </button>

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
              <img key={i} src={url} alt={event.title} className="min-w-full object-cover snap-start flex-shrink-0" style={{ aspectRatio: '16/9' }} />
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
            {event.category && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white/90 w-fit mb-2"
                style={{ background: 'rgba(255,255,255,0.15)' }}>{event.category}</span>
            )}
            <h2 className="font-display text-xl text-white leading-snug drop-shadow">{event.title}</h2>
          </div>
        </div>
      )}

      <div className="px-5 py-5 space-y-4">
        {/* Category + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.category && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
              style={{ background: catColor }}>{event.category}</span>
          )}
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
          <button onClick={askWhatsApp}
            className="w-full py-3.5 bg-teal text-white font-bold rounded-sm flex items-center justify-center gap-2 text-sm">
            <span>💬</span> Ask on WhatsApp
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
