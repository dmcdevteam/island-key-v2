'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useEssentialsCart } from '@/lib/essentials-cart'

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Beach', baby: 'Baby', camping: 'Camping',
  sport: 'Sport', comfort: 'Comfort', other: 'Other',
}

function ProductContent() {
  const router = useRouter()
  const params = useParams()
  const slug     = params.slug as string
  const category = params.category as string

  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addItem, items } = useEssentialsCart()

  useEffect(() => {
    fetch(`/api/rentals/essentials/${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => { setItem(d.essential ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  const inCart = items.some(i => i.id === item?.id)

  function handleAddToCart() {
    if (!item) return
    addItem({
      id:          item.id,
      slug:        item.slug ?? slug,
      name:        item.name,
      category:    item.category,
      price_per_day: item.price_per_day ?? 0,
      image_wide:  item.image_wide ?? null,
      image_square: item.image_square ?? null,
      days:        1,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-tx-light text-sm">Loading…</p>
    </div>
  )

  if (!item) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
      <p className="text-tx-light text-sm">Product not found.</p>
      <button onClick={() => router.back()} className="text-teal text-sm font-semibold">← Go back</button>
    </div>
  )

  const images: string[] = [
    ...(item.image_wide ? [item.image_wide] : []),
    ...(item.images ?? []).filter((u: string) => u !== item.image_wide),
  ]

  const externalLinks: { label: string; url: string }[] = item.external_links ?? []

  const hasPricingTiers = item.price_3day != null || item.price_week != null

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[100px]">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/rentals/essentials/${category}`)} className="text-navy text-sm">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-medium text-navy leading-tight truncate">{item.name}</h1>
            <p className="text-[11px] text-tx-light">{CATEGORY_LABELS[category] ?? category} · Vacation Essentials</p>
          </div>
        </div>
      </div>

      {/* Image gallery */}
      {images.length > 0 && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImg]}
            alt={item.name}
            className="w-full aspect-[4/3] object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeImg ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 pointer-events-none">
              <button
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center text-sm"
                onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
              >‹</button>
              <button
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center text-sm"
                onClick={() => setActiveImg(i => (i + 1) % images.length)}
              >›</button>
            </div>
          )}
        </div>
      )}

      {images.length === 0 && (
        <div className="w-full aspect-[4/3] bg-sand flex items-center justify-center">
          <span className="text-5xl">📦</span>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 py-5 space-y-5">

        {/* Title + price */}
        <div>
          <h2 className="font-display text-2xl text-navy mb-1">{item.name}</h2>
          {item.price_per_day != null && (
            <p className="text-base font-bold text-teal">€{item.price_per_day} / day</p>
          )}
        </div>

        {/* Pricing tiers */}
        {hasPricingTiers && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest">Pricing Tiers</p>
            <div className="grid grid-cols-3 gap-2">
              {item.price_per_day != null && (
                <div className="bg-white rounded-xl border border-border-light p-3 text-center shadow-sm">
                  <p className="text-[10px] text-tx-light mb-1">Per day</p>
                  <p className="text-base font-bold text-navy">€{item.price_per_day}</p>
                </div>
              )}
              {item.price_3day != null && (
                <div className="bg-white rounded-xl border border-border-light p-3 text-center shadow-sm">
                  <p className="text-[10px] text-tx-light mb-1">3 days</p>
                  <p className="text-base font-bold text-teal">€{item.price_3day}</p>
                </div>
              )}
              {item.price_week != null && (
                <div className="bg-white rounded-xl border border-border-light p-3 text-center shadow-sm">
                  <p className="text-[10px] text-tx-light mb-1">1 week</p>
                  <p className="text-base font-bold text-teal">€{item.price_week}</p>
                </div>
              )}
            </div>
            {item.custom_pricing_note && (
              <p className="text-[11px] text-tx-light italic">{item.custom_pricing_note}</p>
            )}
          </div>
        )}

        {/* Description */}
        {item.full_description && (
          <div>
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">About This Product</p>
            <p className="text-sm text-tx-mid leading-relaxed whitespace-pre-line">{item.full_description}</p>
          </div>
        )}

        {!item.full_description && item.description && (
          <p className="text-sm text-tx-mid leading-relaxed">{item.description}</p>
        )}

        {/* Usage instructions */}
        {item.usage_instructions && (
          <div className="bg-sand rounded-xl p-4">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">How to Use</p>
            <p className="text-sm text-tx-mid leading-relaxed whitespace-pre-line">{item.usage_instructions}</p>
          </div>
        )}

        {/* External links */}
        {externalLinks.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-2">Useful Links</p>
            <div className="space-y-2">
              {externalLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-white border border-border-light rounded-xl px-4 py-3 text-sm text-navy font-medium hover:border-navy/40 transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="text-tx-light text-xs">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky add-to-cart bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border-light px-4 py-4 shadow-2xl">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={inCart}
            className={`flex-1 py-3 font-semibold rounded-xl text-sm transition-all active:scale-[0.98] ${
              inCart
                ? 'bg-teal/20 text-teal border border-teal/40'
                : addedToCart
                ? 'bg-teal text-white'
                : 'bg-navy text-white'
            }`}
          >
            {inCart ? '✓ Added to Cart' : addedToCart ? '✓ Added!' : '+ Add to Cart'}
          </button>
          {inCart && (
            <button
              onClick={() => router.push('/rentals/essentials/cart')}
              className="px-4 py-3 bg-teal text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              View Cart →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EssentialsProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ProductContent />
    </Suspense>
  )
}
