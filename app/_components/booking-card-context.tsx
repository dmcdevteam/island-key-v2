'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface BookingCardCtx {
  visible: boolean
  setVisible: (v: boolean) => void
}

const Ctx = createContext<BookingCardCtx>({ visible: false, setVisible: () => {} })

export function BookingCardProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const set = useCallback((v: boolean) => setVisible(v), [])
  return <Ctx.Provider value={{ visible, setVisible: set }}>{children}</Ctx.Provider>
}

export function useBookingCard() {
  return useContext(Ctx)
}
