'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

function CategoryContent() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string

  const [items, setItems] = useState<RentalExtra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/rentals/essentials?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => {
        setItems(Array.isArray(data.essentials) ? data.essentials : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category])

  const label = CATEGORY_LABELS[category] ?? category
  const waMessage = encodeURIComponent(`Hi, I'd like to enquire about ${label} essentials for my stay.`)
  const waLink = `https://wa.me/306974176759?text=${waMessage}`

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">{label}</h1>
            <p className="text-[11px] text-tx-light">Vacation Essentials</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-tx-light text-sm">Loading…</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-tx-light text-sm text-center">Nothing listed in this category yet.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg border border-border-light overflow-hidden shadow-sm">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-[140px] object-cover"
                />
              ) : (
                <div className="w-full h-[140px] flex items-center justify-center text-3xl" style={{ background: '#FDFCFA' }}>
                  {CATEGORY_EMOJIS[item.category] ?? '📦'}
                </div>
              )}
              <div className="p-3">
                <p className="text-[13px] font-semibold text-navy leading-snug">{item.name}</p>
                <p className="text-[12px] text-teal mt-1">
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

export default function EssentialsCategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <CategoryContent />
    </Suspense>
  )
}
