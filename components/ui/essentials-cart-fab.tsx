'use client'

import { useEssentialsCart } from '@/lib/essentials-cart'
import { usePathname, useRouter } from 'next/navigation'

export function EssentialsCartFab() {
  const { cartCount } = useEssentialsCart()
  const pathname = usePathname()
  const router = useRouter()

  // Hide on the cart page itself
  if (cartCount === 0 || pathname === '/rentals/essentials/cart') return null

  return (
    <button
      onClick={() => router.push('/rentals/essentials/cart')}
      className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-navy text-white px-4 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
      aria-label={`View essentials cart (${cartCount} items)`}
    >
      <span className="text-base">🛒</span>
      <span className="text-sm font-semibold">Essentials</span>
      <span className="bg-teal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
        {cartCount}
      </span>
    </button>
  )
}
