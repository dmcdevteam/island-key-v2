'use client'

import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function ProfileAvatar() {
  const router = useRouter()
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (s?.first_name) setInitial(s.first_name.charAt(0).toUpperCase())
  }, [])

  return (
    <button
      onClick={() => router.push('/profile')}
      aria-label="My profile"
      className="w-9 h-9 rounded-full bg-navy flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity"
    >
      {initial ? (
        <span className="text-[14px] font-bold text-cream leading-none">{initial}</span>
      ) : (
        <span className="text-[16px] leading-none">👤</span>
      )}
    </button>
  )
}
