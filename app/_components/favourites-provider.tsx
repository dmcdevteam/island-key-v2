'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSession } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavouriteRecord {
  id: string
  item_id: string
  item_type: string
  item_slug: string
  item_title: string
  item_image: string | null
  item_price: string | null
  created_at: string
}

export interface FavouriteToggleItem {
  id: string
  type: string
  slug: string
  title: string
  image?: string | null
  price?: string | null
}

interface FavouritesContextValue {
  favourites: FavouriteRecord[]
  sessionId: string | null
  isFavourited: (itemId: string) => boolean
  toggleFavourite: (item: FavouriteToggleItem) => void
  loading: boolean
}

// ─── Stable browser session ID ────────────────────────────────────────────────

function getClientSessionId(): string | null {
  if (typeof window === 'undefined') return null
  let id = localStorage.getItem('ik_client_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ik_client_id', id)
  }
  return id
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FavouritesContext = createContext<FavouritesContextValue>({
  favourites: [],
  sessionId: null,
  isFavourited: () => false,
  toggleFavourite: () => {},
  loading: false,
})

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteRecord[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    const sid = session?.guest_id ?? getClientSessionId()
    if (!sid) { setLoading(false); return }
    setSessionId(sid)

    fetch(`/api/favourites?session_id=${encodeURIComponent(sid)}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFavourites(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isFavourited = useCallback((itemId: string) => {
    return favourites.some(f => f.item_id === itemId)
  }, [favourites])

  const toggleFavourite = useCallback((item: FavouriteToggleItem) => {
    if (!sessionId) return
    const existing = favourites.find(f => f.item_id === item.id)

    if (existing) {
      // Optimistic remove
      setFavourites(prev => prev.filter(f => f.item_id !== item.id))
      fetch(`/api/favourites/${existing.id}`, { method: 'DELETE' })
        .catch(() => setFavourites(prev => [...prev, existing]))
    } else {
      // Optimistic add
      const optimistic: FavouriteRecord = {
        id: `opt-${Date.now()}`,
        item_id: item.id,
        item_type: item.type,
        item_slug: item.slug,
        item_title: item.title,
        item_image: item.image ?? null,
        item_price: item.price ?? null,
        created_at: new Date().toISOString(),
      }
      setFavourites(prev => [...prev, optimistic])
      fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_session_id: sessionId,
          item_type: item.type,
          item_id: item.id,
          item_slug: item.slug,
          item_title: item.title,
          item_image: item.image ?? null,
          item_price: item.price ?? null,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setFavourites(prev =>
              prev.map(f => f.id === optimistic.id ? { ...optimistic, id: data.id } : f)
            )
          }
        })
        .catch(() => setFavourites(prev => prev.filter(f => f.id !== optimistic.id)))
    }
  }, [favourites, sessionId])

  return (
    <FavouritesContext.Provider value={{ favourites, sessionId, isFavourited, toggleFavourite, loading }}>
      {children}
    </FavouritesContext.Provider>
  )
}

export function useFavourites() {
  return useContext(FavouritesContext)
}
