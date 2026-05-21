'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Service, ServiceSubcategory } from '@/lib/types'

// URL slugs use hyphens; DB values use underscores
function toDbSlug(urlSlug: string): string {
  return urlSlug.replace(/-/g, '_')
}

export default function ServiceListingsPage() {
  const router  = useRouter()
  const params  = useParams()
  const categoryParam   = params?.category   as string // 'in-house' | 'reservations'
  const subcategoryParam = params?.subcategory as string // e.g. 'wellness-health'

  const subcategoryDb = toDbSlug(subcategoryParam ?? '')

  const [services,    setServices]    = useState<Service[]>([])
  const [subcatMeta,  setSubcatMeta]  = useState<ServiceSubcategory | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!subcategoryDb) return
    Promise.all([
      fetch(`/api/services?subcategory=${subcategoryDb}`).then(r => r.json()),
      fetch(`/api/services/subcategories`).then(r => r.json()),
    ]).then(([svcData, subData]) => {
      setServices(Array.isArray(svcData.services) ? svcData.services : [])
      const allSubs: ServiceSubcategory[] = Array.isArray(subData.subcategories) ? subData.subcategories : []
      setSubcatMeta(allSubs.find(s => s.subcategory === subcategoryDb) ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [subcategoryDb])

  const parentPath = categoryParam === 'in-house' ? '/services/in-house'
    : categoryParam === 'reservations' ? '/services/reservations'
    : `/services/${categoryParam}`

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(parentPath)} className="text-navy text-sm flex-shrink-0">←</button>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-medium text-navy leading-tight truncate">
              {subcatMeta?.label ?? subcategoryParam}
            </h1>
            {subcatMeta?.tagline && (
              <p className="text-[11px] text-tx-light truncate">{subcatMeta.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Service cards */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="h-[200px] rounded-sm bg-navy/5 animate-pulse" />)}
          </div>
        )}

        {!loading && services.length === 0 && (
          <p className="text-sm text-tx-light text-center mt-12">No services in this category yet.</p>
        )}

        {!loading && services.length > 0 && (
          <div className="flex flex-col gap-4">
            {services.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-sm border border-border-light overflow-hidden"
              >
                {/* Hero image */}
                {(s.image_wide ?? s.images?.[0]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_wide ?? s.images![0]}
                    alt={s.title}
                    className="w-full h-[160px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[120px] bg-navy/10 flex items-center justify-center">
                    <span className="text-4xl">🛎️</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-display text-base text-navy leading-tight">{s.title}</h3>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {s.is_on_offer && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-terra text-white whitespace-nowrap">
                          Special Offer
                        </span>
                      )}
                      {s.duration && (
                        <span className="text-[11px] text-tx-mid bg-sand border border-border-light rounded-full px-2 py-0.5 whitespace-nowrap">
                          ⏱ {s.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  {s.service_type && (
                    <span className="inline-block text-[10px] font-semibold text-teal border border-teal/30 rounded-full px-2 py-0.5 mb-1.5">
                      {s.service_type}
                    </span>
                  )}
                  {s.short_description && (
                    <p className="text-xs text-tx-light mb-2 line-clamp-2">{s.short_description}</p>
                  )}
                  <div className="mb-3">
                    {s.is_on_offer && s.offer_price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-terra">from €{s.offer_price}</span>
                        <span className="text-xs text-tx-light line-through">{s.price_label ?? (s.price_from ? `€${s.price_from}` : '')}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-terra">
                        {s.price_label ?? (s.price_from ? `from €${s.price_from}` : 'Price on request')}
                      </span>
                    )}
                    {s.is_on_offer && s.offer_label && (
                      <p className="text-[11px] text-terra/80 mt-0.5">{s.offer_label}</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/services/${s.slug}`)}
                    className="w-full py-2.5 bg-navy text-white text-sm font-semibold rounded-sm active:scale-[0.98] transition-transform"
                  >
                    Enquire →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
