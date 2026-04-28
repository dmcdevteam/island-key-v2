'use client'

import { usePathname } from 'next/navigation'

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className={pathname.startsWith('/admin') ? 'admin-shell' : 'app-shell'}>
      {children}
    </div>
  )
}
