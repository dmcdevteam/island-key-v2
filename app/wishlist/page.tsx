'use client'

import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { useFavourites } from '@/app/_components/favourites-provider'
import type { FavouriteRecord } from '@/app/_components/favourites-provider'

function itemHref(item: FavouriteRecord): string {
  switch (item.item_type) {
    case 'activity': return `/activities/${item.item_slug}`
    case 'service':  return `/services/${item.item_slug}`
    case 'deal':     return `/deals`
    default:         return `/${item.item_type}s/${item.item_slug}`
  }
}

const TYPE_LABELS: Record<string, string> = {
  activity: 'Experience',
  service:  'Service',
  deal:     'Deal',
}

export default function WishlistPage() {
  const router = useRouter()
  const { favourites, loading, toggleFavourite } = useFavourites()

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">Wishlist</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Your saved experiences and services</p>
      </div>

      <div className="flex-1 px-5">
        {loading && (
          <div className="flex flex-col gap-3 pt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[88px] rounded-sm bg-navy/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && favourites.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <span className="text-5xl opacity-30">🤍</span>
            <p className="text-sm text-tx-light text-center">
              Nothing saved yet.<br />Tap the heart on any experience or service to save it here.
            </p>
          </div>
        )}

        {!loading && favourites.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            {favourites.map(item => (
              <div
                key={item.id}
                className="flex gap-3 bg-white rounded-sm border border-border-light overflow-hidden active:scale-[0.99] transition-transform"
              >
                <button
                  onClick={() => router.push(itemHref(item))}
                  className="flex gap-3 flex-1 text-left p-3"
                >
                  {item.item_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.item_image}
                      alt={item.item_title}
                      className="w-[72px] h-[72px] object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[72px] h-[72px] bg-navy/10 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-2xl">🛎️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    {item.item_type && (
                      <span className="text-[10px] font-bold uppercase text-teal tracking-wide">
                        {TYPE_LABELS[item.item_type] ?? item.item_type}
                      </span>
                    )}
                    <p className="font-display text-sm text-navy leading-tight mt-0.5 line-clamp-2">
                      {item.item_title}
                    </p>
                    {item.item_price && (
                      <p className="text-xs font-semibold text-terra mt-1">{item.item_price}</p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => toggleFavourite({
                    id: item.item_id,
                    type: item.item_type,
                    slug: item.item_slug,
                    title: item.item_title,
                    image: item.item_image,
                    price: item.item_price,
                  })}
                  className="pr-3 flex items-center text-xl text-red-400 active:scale-90 transition-transform"
                  aria-label="Remove from wishlist"
                >
                  ❤️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
