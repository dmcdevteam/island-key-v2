'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SmartCard } from '@/lib/types'

const TRIGGER_BADGE: Partial<Record<SmartCard['trigger_type'], string>> = {
  weather_hot:   '☀️ Hot day pick',
  weather_windy: '💨 Wind-proof',
  weather_rainy: '🌧️ Rainy day',
  weather_clear: '✨ Perfect day',
}

function timeLabel(): string {
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return 'Good Morning Picks'
  if (h >= 12 && h < 17) return "Today's Highlights"
  if (h >= 17 && h < 21) return 'Tonight in Crete'
  return 'Late Discoveries'
}

function EndsInTimer({ validUntil }: { validUntil: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(validUntil).getTime() - Date.now()
      if (diff <= 0) { setLabel(''); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`Ends in ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [validUntil])
  if (!label) return null
  return <>{label}</>
}

function SmartCardItem({ card }: { card: SmartCard }) {
  const router = useRouter()

  function navigate() {
    if (card.cta_url.startsWith('http')) {
      window.open(card.cta_url, '_blank', 'noopener noreferrer')
    } else {
      router.push(card.cta_url)
    }
  }

  const showEndsIn = card.valid_until
    ? new Date(card.valid_until).getTime() - Date.now() < 24 * 3600 * 1000
    : false

  const badge = TRIGGER_BADGE[card.trigger_type] ?? null

  return (
    <div
      onClick={navigate}
      className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md bg-white cursor-pointer active:scale-[0.97] transition-transform"
      style={{ width: 220 }}
    >
      {/* Image area */}
      <div className="relative" style={{ height: 140 }}>
        {card.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy to-teal" />
        )}

        {badge && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            {badge}
          </div>
        )}

        {showEndsIn && card.valid_until && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-terra text-white">
            <EndsInTimer validUntil={card.valid_until} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-3">
        <p className="text-sm font-semibold text-navy leading-tight line-clamp-2">{card.title}</p>
        {card.subtitle && (
          <p className="text-[12px] text-tx-light mt-1 truncate">{card.subtitle}</p>
        )}
        <button
          onClick={e => { e.stopPropagation(); navigate() }}
          className="w-full mt-3 py-2 bg-navy text-white text-[13px] font-semibold rounded-xl hover:bg-navy-light transition-colors"
        >
          {card.cta_label}
        </button>
      </div>
    </div>
  )
}

export function SmartFeed() {
  const [cards, setCards] = useState<SmartCard[]>([])
  const [status, setStatus] = useState<'loading' | 'done'>('loading')

  useEffect(() => {
    fetch('/api/smart-cards')
      .then(r => r.json())
      .then(data => {
        setCards(Array.isArray(data.cards) ? data.cards : [])
        setStatus('done')
      })
      .catch(() => setStatus('done'))
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex gap-3 overflow-hidden mb-5" style={{ paddingLeft: 20, paddingRight: 20 }}>
        {[1, 2].map(i => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl bg-navy/5 animate-pulse"
            style={{ width: 220, height: 240 }}
          />
        ))}
      </div>
    )
  }

  if (cards.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex items-center px-5 mb-3">
        <h2
          className="font-display text-navy"
          style={{ fontSize: 16, fontWeight: 500 }}
        >
          {timeLabel()}
        </h2>
      </div>
      <div
        className="flex gap-3 overflow-x-auto no-scrollbar"
        style={{ paddingLeft: 20, paddingRight: 20 }}
      >
        {cards.map(card => (
          <SmartCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
