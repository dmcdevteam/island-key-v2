'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { HeartButton } from '@/components/ui/components'
import { ProfileAvatar } from '@/app/_components/profile-avatar'
import { getSession } from '@/lib/utils'
import type { DealFull, GuestSession } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  dining: '#D4854A', activity: '#1A8A7D', retail: '#1B2D4F',
  wellness: '#9B59B6', transport: '#5A5A5A', accommodation: '#D4A843', other: '#5A5A5A',
}

function formatCountdown(validUntil: string | null): string | null {
  if (!validUntil) return null
  const diff = new Date(validUntil).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  if (diff > 72 * 3600000) return null // don't show unless within 72h
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `Expires in ${h}h ${m}m`
}

function DealModal({ deal, session, onClose }: { deal: DealFull; session: GuestSession; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    if (deal.code) {
      navigator.clipboard.writeText(deal.code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  function claimWhatsApp() {
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '306900000000'
    const msg = `Hi, I'd like to claim the ${deal.title} deal. My name is ${session.first_name} staying at ${session.property_name}.`
    // Track redemption
    fetch(`/api/deals/${deal.id}/redeem`, { method: 'POST' })
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const countdown = formatCountdown(deal.valid_until)

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Image carousel / placeholder */}
        <div className="relative">
          {deal.images && deal.images.length > 0 ? (
            <div className="overflow-x-auto flex snap-x snap-mandatory no-scrollbar">
              {deal.images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={deal.title} className="min-w-full aspect-video object-cover snap-start flex-shrink-0" />
              ))}
            </div>
          ) : (
            <div className="aspect-video bg-navy flex items-center justify-center">
              <span className="text-4xl">{deal.category === 'dining' ? '🍽️' : deal.category === 'activity' ? '🌊' : '🎁'}</span>
            </div>
          )}
          {deal.category && (
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase px-2 py-1 rounded text-white"
              style={{ background: CATEGORY_COLORS[deal.category] ?? '#5A5A5A' }}>
              {deal.category}
            </span>
          )}
          {deal.discount_label && (
            <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded bg-teal text-white">
              {deal.discount_label}
            </span>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <h2 className="font-display text-xl text-navy">{deal.title}</h2>
            {countdown && (
              <p className="text-xs font-semibold text-amber-600 mt-1">⏱ {countdown}</p>
            )}
          </div>

          {deal.description && (
            <p className="text-sm text-tx-mid leading-relaxed">{deal.description}</p>
          )}

          {/* Pricing */}
          {(deal.original_price || deal.deal_price) && (
            <div className="flex items-baseline gap-3">
              {deal.original_price && (
                <span className="text-sm text-tx-light line-through">€{deal.original_price}</span>
              )}
              {deal.deal_price && (
                <span className="text-xl font-bold text-terra">€{deal.deal_price}</span>
              )}
            </div>
          )}

          {/* Code */}
          {deal.code && (
            <div>
              <p className="text-xs font-bold text-tx-mid uppercase mb-1.5">Redemption Code</p>
              <button
                onClick={copyCode}
                className="w-full flex items-center justify-between px-4 py-3 bg-sand border border-border rounded-sm font-mono font-bold text-navy hover:border-navy transition-colors"
              >
                <span>{deal.code}</span>
                <span className="text-xs text-teal font-semibold">{copied ? 'Copied!' : 'Tap to copy'}</span>
              </button>
            </div>
          )}

          {/* Terms */}
          {deal.terms && (
            <details className="group">
              <summary className="text-xs font-semibold text-tx-light cursor-pointer hover:text-tx list-none flex items-center gap-1">
                <span>Terms & Conditions</span>
                <span className="group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-xs text-tx-light leading-relaxed">{deal.terms}</p>
            </details>
          )}

          {/* Valid until */}
          {deal.valid_until && (
            <p className="text-xs text-tx-light">
              Valid until {new Date(deal.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={claimWhatsApp}
            className="w-full py-3.5 bg-teal text-white font-bold rounded-sm flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform"
          >
            <span>💬</span> Claim via WhatsApp
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}

export default function DealsPage() {
  const router = useRouter()
  const [session, setSession] = useState<GuestSession | null>(null)
  const [deals, setDeals] = useState<DealFull[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<DealFull | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/splash'); return }
    setSession(s)

    const params = new URLSearchParams({
      tier: s.tier,
      region: s.region,
      ...(s.property_id ? { property_id: s.property_id } : {}),
    })
    fetch(`/api/deals?${params}`)
      .then(r => r.json())
      .then(data => { setDeals(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  if (!session) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
            <h1 className="font-display text-xl font-medium text-navy">Deals & Offers</h1>
          </div>
          <ProfileAvatar />
        </div>
        <p className="text-xs text-tx-light mt-0.5">Exclusive to Island Key guests</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 rounded-sm bg-navy/5 animate-pulse" />)}
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-3xl mb-3">🎁</p>
            <p className="text-sm font-semibold text-navy mb-1">Check back soon</p>
            <p className="text-xs text-tx-light">New deals drop regularly — exclusive to Island Key guests.</p>
          </div>
        )}

        {!loading && deals.length > 0 && (
          <div className="flex flex-col gap-3">
            {deals.map(deal => {
              const countdown = formatCountdown(deal.valid_until)
              return (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className="w-full text-left bg-white rounded-sm border border-border-light overflow-hidden active:scale-[0.98] transition-transform"
                >
                  {/* Image */}
                  {deal.images?.[0] ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={deal.images[0]} alt={deal.title} className="w-full aspect-video object-cover" />
                      {deal.category && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
                          style={{ background: CATEGORY_COLORS[deal.category] ?? '#5A5A5A' }}>
                          {deal.category}
                        </span>
                      )}
                      <div className="absolute top-2 right-2">
                        <HeartButton item={{ id: deal.id, type: 'deal', slug: deal.slug, title: deal.title, image: deal.images?.[0] ?? null, price: deal.deal_price ? `€${deal.deal_price}` : null }} />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-navy flex items-center justify-center relative">
                      <span className="text-3xl">{deal.category === 'dining' ? '🍽️' : '🎁'}</span>
                      {deal.discount_label && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-teal text-white">
                          {deal.discount_label}
                        </span>
                      )}
                      <div className="absolute top-2 right-2">
                        <HeartButton item={{ id: deal.id, type: 'deal', slug: deal.slug, title: deal.title, image: null, price: deal.deal_price ? `€${deal.deal_price}` : null }} />
                      </div>
                    </div>
                  )}

                  <div className="p-3.5">
                    <h3 className="font-semibold text-sm text-navy mb-1">{deal.title}</h3>
                    {deal.short_description && (
                      <p className="text-xs text-tx-light mb-2 line-clamp-2">{deal.short_description}</p>
                    )}
                    {countdown && (
                      <p className="text-[11px] font-semibold text-amber-600 mb-2">⏱ {countdown}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {(deal.original_price || deal.deal_price) ? (
                        <div className="flex items-baseline gap-2">
                          {deal.original_price && <span className="text-xs text-tx-light line-through">€{deal.original_price}</span>}
                          {deal.deal_price && <span className="text-sm font-bold text-terra">€{deal.deal_price}</span>}
                        </div>
                      ) : <span />}
                      <span className="text-xs font-semibold text-teal">View Deal →</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedDeal && session && (
        <DealModal deal={selectedDeal} session={session} onClose={() => setSelectedDeal(null)} />
      )}

      <BottomNav />
    </div>
  )
}
