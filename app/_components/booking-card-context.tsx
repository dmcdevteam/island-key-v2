'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface BookingCardCtx {
  visible:       boolean
  setVisible:    (v: boolean) => void
  drawerOpen:    boolean
  setDrawerOpen: (v: boolean) => void
}

const Ctx = createContext<BookingCardCtx>({
  visible: false, setVisible: () => {},
  drawerOpen: false, setDrawerOpen: () => {},
})

export function BookingCardProvider({ children }: { children: React.ReactNode }) {
  const [visible,    setVisible]    = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const setVis = useCallback((v: boolean) => setVisible(v), [])
  const setDrw = useCallback((v: boolean) => setDrawerOpen(v), [])
  return (
    <Ctx.Provider value={{ visible, setVisible: setVis, drawerOpen, setDrawerOpen: setDrw }}>
      {children}
    </Ctx.Provider>
  )
}

export function useBookingCard() {
  return useContext(Ctx)
}
