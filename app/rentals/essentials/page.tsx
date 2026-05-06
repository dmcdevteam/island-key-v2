'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type RentalExtra = {
  id: string
  name: string
  description: string | null
  category: string
  price_per_day: number | null
  price_per_unit: number | null
  unit_label: string
  image: string | null
  is_active: boolean
  sort_order: number
}

const CATEGORY_LABELS: Record<string, string> = {
  beach:   'Beach',
  baby:    'Baby',
  camping: 'Camping',
  sport:   'Sport',
  comfort: 'Comfort',
  other:   'Other',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  beach:   '🏖',
  baby:    '🍼',
  camping: '⛺',
  sport:   '🏄',
  comfort: '🛋',
  other:   '📦',
}

const CATEGORY_ORDER = ['beach', 'baby', 'camping', 'sport', 'comfort', 'other']

export default function EssentialsPage() {
  const router = useRouter()
  const [essentials, setEssentials] = useState<RentalExtra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rentals/essentials')
      .then(r => r.json())
      .then(data => {
        setEssentials(Array.isArray(data.essentials) ? data.essentials : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const grouped = CATEGORY_ORDER.reduce<Record<string, RentalExtra[]>>((acc, cat) => {
    const items = essentials.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const waMessage = encodeURIComponent("Hi, I'd like to enquire about Vacation Essentials for my stay.")
  const waLink = `https://wa.me/306974176759?text=${waMessage}`

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">Vacation Essentials</h1>
            <p className="text-[11px] text-tx-light">Delivered to your door</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-tx-mid leading-relaxed">
          Everything you need for the perfect Cretan holiday — delivered to your door.
        </p>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-tx-light text-sm">Loading…</p>
        </div>
      )}

      {!loading && essentials.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-tx-light text-sm text-center">No essentials listed yet — check back soon.</p>
        </div>
      )}

      {!loading && essentials.length > 0 && (
        <div className="px-4 pt-4 space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="font-display text-base font-semibold text-navy mb-3">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-border-light p-4 flex items-start gap-3 shadow-sm">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center text-2xl flex-shrink-0">
                        {CATEGORY_EMOJIS[item.category] ?? '📦'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-tx-light mt-0.5 leading-snug">{item.description}</p>
                      )}
                      <p className="text-[11px] text-teal font-semibold mt-1">
                        {item.price_per_day != null
                          ? `€${item.price_per_day} / day`
                          : item.price_per_unit != null
                          ? `€${item.price_per_unit} per ${item.unit_label}`
                          : 'Price on request'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WhatsApp CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 bg-cream border-t border-border-light">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform shadow-md"
        >
          Enquire via WhatsApp →
        </a>
      </div>
    </div>
  )
}
