'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { CartItem } from '@/lib/types'

const STORAGE_KEY = 'ike_essentials_cart'

type CartContextType = {
  items: CartItem[]
  cartCount: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function EssentialsCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, initialized])

  function addItem(item: Omit<CartItem, 'quantity'>) {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  function clearCart() {
    setItems([])
  }

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, cartCount, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useEssentialsCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useEssentialsCart must be used within EssentialsCartProvider')
  return ctx
}
