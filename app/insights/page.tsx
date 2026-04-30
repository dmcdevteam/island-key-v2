'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { CategoryChip, HeartButton } from '@/components/ui/components'
import { FocalImage } from '@/components/FocalImage'
import { ProfileAvatar } from '@/app/_components/profile-avatar'
import type { ArticleFull } from '@/lib/types'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'local_guide', label: '📍 Guides' },
  { key: 'food_drink', label: '🍽️ Food & Drink' },
  { key: 'culture', label: '🏛 Culture' },
  { key: 'adventure', label: '🧗 Adventure' },
  { key: 'beaches', label: '🏖️ Beaches' },
  { key: 'tips', label: '💡 Tips' },
  { key: 'seasonal', label: '🌸 Seasonal' },
]

const CATEGORY_STYLES: Record<string, { bg: string; tagColor: string }> = {
  local_guide: { bg: 'linear-gradient(135deg,rgba(26,138,125,0.1),rgba(107,123,94,0.07))', tagColor: '#1A8A7D' },
  food_drink:  { bg: 'linear-gradient(135deg,rgba(212,133,74,0.1),rgba(196,112,63,0.07))', tagColor: '#D4854A' },
  culture:     { bg: 'linear-gradient(135deg,rgba(27,45,79,0.1),rgba(122,107,93,0.07))',   tagColor: '#1B2D4F' },
  adventure:   { bg: 'linear-gradient(135deg,rgba(107,123,94,0.1),rgba(26,138,125,0.07))', tagColor: '#5B7A3D' },
  beaches:     { bg: 'linear-gradient(135deg,rgba(26,138,125,0.07),rgba(52,152,219,0.07))',tagColor: '#1A8A7D' },
  tips:        { bg: 'linear-gradient(135deg,rgba(212,168,67,0.1),rgba(107,123,94,0.07))', tagColor: '#D4A843' },
  seasonal:    { bg: 'linear-gradient(135deg,rgba(212,133,74,0.07),rgba(26,138,125,0.07))',tagColor: '#D4854A' },
  other:       { bg: 'linear-gradient(135deg,rgba(27,45,79,0.05),rgba(107,123,94,0.05))',  tagColor: '#5A5A5A' },
}
const DEFAULT_STYLE = CATEGORY_STYLES.other

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

export default function InsightsPage() {
  const router = useRouter()
  const [activeCat, setActiveCat] = useState('all')
  const [articles, setArticles] = useState<ArticleFull[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = activeCat !== 'all' ? `?category=${activeCat}` : ''
    fetch(`/api/articles${params}`)
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCat])

  const featured = articles.find(a => a.is_featured)
  const rest = articles.filter(a => !a.is_featured || articles.indexOf(a) > 0)

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
            <h1 className="font-display text-xl font-medium text-navy">Local Insights</h1>
          </div>
          <ProfileAvatar />
        </div>
        <p className="text-xs text-tx-light mt-0.5">Stories, guides & tips from the island</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-3 flex-shrink-0">
        {CATEGORIES.map(cat => (
          <CategoryChip key={cat.key} label={cat.label} active={activeCat === cat.key} onClick={() => setActiveCat(cat.key)} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-sm overflow-hidden border border-border-light">
                <div className="h-[140px] bg-navy/5 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-navy/5 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-navy/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <p className="text-center text-tx-light text-sm mt-12">No articles in this category yet.</p>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {/* Featured hero card */}
            {featured && activeCat === 'all' && (
              <button
                onClick={() => router.push(`/insights/${featured.slug}`)}
                className="w-full text-left bg-white rounded-sm overflow-hidden border border-border-light active:scale-[0.98] transition-transform"
              >
                {featured.cover_image ? (
                  <div className="relative">
                    <FocalImage src={featured.cover_image} alt={featured.title} className="w-full h-52 object-cover" focalPoint={featured.focal_x != null && featured.focal_y != null ? { x: featured.focal_x, y: featured.focal_y } : null} />
                    <div className="absolute top-2 right-2 z-10">
                      <HeartButton item={{ id: featured.id, type: 'article', slug: featured.slug, title: featured.title, image: featured.cover_image, price: null }} />
                    </div>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center relative" style={{ background: (CATEGORY_STYLES[featured.category ?? ''] ?? DEFAULT_STYLE).bg }}>
                    <span className="text-4xl">📖</span>
                    <div className="absolute top-2 right-2 z-10">
                      <HeartButton item={{ id: featured.id, type: 'article', slug: featured.slug, title: featured.title, image: null, price: null }} />
                    </div>
                  </div>
                )}
                <div className="p-4">
                  {featured.category && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white mb-2 inline-block"
                      style={{ background: (CATEGORY_STYLES[featured.category] ?? DEFAULT_STYLE).tagColor }}>
                      {featured.category.replace('_', ' ')}
                    </span>
                  )}
                  <h2 className="font-display text-lg text-navy mb-1 leading-tight">{featured.title}</h2>
                  {featured.excerpt && <p className="text-sm text-tx-mid line-clamp-2">{featured.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-tx-light">
                    <span>{relativeDate(featured.published_at)}</span>
                    <span>·</span>
                    <span>{featured.read_time_minutes} min read</span>
                  </div>
                </div>
              </button>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              {(activeCat === 'all' ? rest : articles).map(article => {
                const style = CATEGORY_STYLES[article.category ?? ''] ?? DEFAULT_STYLE
                return (
                  <button
                    key={article.id}
                    onClick={() => router.push(`/insights/${article.slug}`)}
                    className="text-left bg-white rounded-sm overflow-hidden border border-border-light active:scale-[0.98] transition-transform"
                  >
                    {article.cover_image ? (
                      <div className="relative">
                        <FocalImage src={article.cover_image} alt={article.title} className="w-full aspect-video object-cover" focalPoint={article.focal_x != null && article.focal_y != null ? { x: article.focal_x, y: article.focal_y } : null} />
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <HeartButton item={{ id: article.id, type: 'article', slug: article.slug, title: article.title, image: article.cover_image, price: null }} />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center relative" style={{ background: style.bg }}>
                        {article.category && (
                          <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
                            style={{ background: style.tagColor }}>
                            {article.category.replace('_', ' ')}
                          </span>
                        )}
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <HeartButton item={{ id: article.id, type: 'article', slug: article.slug, title: article.title, image: null, price: null }} />
                        </div>
                      </div>
                    )}
                    <div className="p-2.5">
                      <h3 className="font-semibold text-xs text-navy mb-1 leading-snug line-clamp-2">{article.title}</h3>
                      {article.excerpt && <p className="text-[10px] text-tx-light line-clamp-2 mb-1">{article.excerpt}</p>}
                      <span className="text-[10px] text-tx-light">{article.read_time_minutes} min read</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
