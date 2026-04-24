'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import type { InfoPageFull } from '@/lib/types'

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-navy mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-navy mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-navy mt-5 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-teal pl-4 my-3 italic text-tx-mid text-sm">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-tx-mid leading-relaxed">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-teal underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p class="text-sm text-tx-mid leading-relaxed mb-3">')
    .replace(/\n/g, '<br />')
}

export default function InfoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const [page, setPage] = useState<InfoPageFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline) }
  }, [])

  useEffect(() => {
    if (!slug) return
    fetch(`/api/info-pages/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setPage(null); setLoading(false); return }
        setPage(data)
        if (data.sections?.length > 0) setActiveSection(data.sections[0].heading)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
        <div className="px-5 pt-[52px] pb-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-navy/5 rounded animate-pulse" />)}
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center pb-[90px]">
        <p className="text-tx-light text-sm">Page not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-teal text-sm font-semibold">← Go back</button>
        <BottomNav />
      </div>
    )
  }

  const hasSections = page.sections && page.sections.length > 0

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
          You&apos;re viewing a cached version — offline mode
        </div>
      )}

      <div className="px-5 pt-[52px] pb-4 border-b border-border-light bg-white">
        <button onClick={() => router.push('/info')} className="text-teal text-xs font-semibold mb-3">← Back to Info</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{page.icon ?? '📄'}</span>
          <div>
            <h1 className="font-display text-xl text-navy">{page.title}</h1>
            {page.category && <p className="text-xs text-tx-light capitalize">{page.category}</p>}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${hasSections ? 'md:flex' : ''}`}>
        {/* Table of contents — tablet+ sidebar */}
        {hasSections && (
          <aside className="hidden md:block w-56 flex-shrink-0 border-r border-border-light bg-white px-4 py-5 sticky top-0 h-screen overflow-y-auto">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-3">Contents</p>
            <nav className="space-y-1">
              {page.sections!.map(s => (
                <button key={s.heading}
                  onClick={() => {
                    setActiveSection(s.heading)
                    document.getElementById(`section-${s.heading.toLowerCase().replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${activeSection === s.heading ? 'bg-navy text-white' : 'text-tx-mid hover:bg-sand'}`}>
                  {s.heading}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Simple content mode */}
          {!hasSections && page.content && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-tx-mid leading-relaxed mb-3">${renderMarkdown(page.content)}</p>` }}
            />
          )}

          {/* Sections mode */}
          {hasSections && page.sections!.map(section => {
            const id = `section-${section.heading.toLowerCase().replace(/\s+/g, '-')}`
            return (
              <div key={section.heading} id={id} className="mb-8">
                <h2 className="font-display text-lg text-navy mb-3 pb-2 border-b border-border-light">{section.heading}</h2>
                {section.content && (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-tx-mid leading-relaxed mb-3">${renderMarkdown(section.content)}</p>` }}
                  />
                )}
              </div>
            )
          })}

          <button onClick={() => router.push('/info')} className="text-teal text-sm font-semibold">← Back to Info</button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
