'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/utils'
import { BottomNav } from '@/components/ui/bottom-nav'

type Notification = {
  id: string
  title: string
  body: string
  type: string
  scheduled_at: string
  is_read: boolean
}

const TYPE_ICONS: Record<string, string> = {
  general:  '🔔',
  booking:  '📋',
  weather:  '🌤️',
  event:    '🎉',
  offer:    '🎁',
  reminder: '⏰',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'Just now'
}

export default function NotificationsPage() {
  const router  = useRouter()
  const session = getSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const batchMarked = useRef(false)

  useEffect(() => {
    if (!session?.guest_id) { setLoading(false); return }
    const params = new URLSearchParams({ guest_id: session.guest_id })
    if (session.property_id) params.set('property_id', session.property_id)
    fetch(`/api/notifications?${params}`)
      .then(r => r.json())
      .then(data => {
        const list: Notification[] = Array.isArray(data.notifications) ? data.notifications : []
        setNotifications(list)
        setLoading(false)
        // Batch mark all unread as read on first load
        if (!batchMarked.current && session.guest_id) {
          batchMarked.current = true
          const unread = list.filter(n => !n.is_read)
          if (unread.length > 0) {
            Promise.all(
              unread.map(n =>
                fetch('/api/notifications/read', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ notification_id: n.id, guest_id: session.guest_id }),
                }).catch(() => {})
              )
            ).then(() => {
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            })
          }
        }
      })
      .catch(() => setLoading(false))
  }, [])

  async function markRead(notificationId: string) {
    if (!session?.guest_id) return
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notificationId, guest_id: session.guest_id }),
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-tx-mid">← Back</button>
        <h1 className="font-display text-xl font-medium text-navy">Notifications</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <p className="text-3xl mb-3">🔔</p>
          <p className="text-sm font-semibold text-navy">No notifications yet</p>
          <p className="text-xs text-tx-light mt-1">We&rsquo;ll let you know about offers, events, and updates.</p>
        </div>
      )}

      <div className="px-5 space-y-3">
        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className="w-full flex items-start gap-3 bg-white rounded-2xl border border-border-light p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
          >
            {/* Unread dot */}
            <div className="flex-shrink-0 flex flex-col items-center pt-0.5">
              <span className="text-xl leading-none">{TYPE_ICONS[n.type] ?? '🔔'}</span>
              {!n.is_read && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${n.is_read ? 'text-navy font-medium' : 'text-navy font-bold'}`}>
                {n.title}
              </p>
              <p className="text-xs text-tx-light mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-[11px] text-tx-light mt-1.5">{timeAgo(n.scheduled_at)}</p>
            </div>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
