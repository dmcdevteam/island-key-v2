'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { FocalImage } from '@/components/FocalImage'
import type { ArticleFull } from '@/lib/types'

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

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-navy mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-navy mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-navy mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-teal pl-4 my-3 italic text-tx-mid text-sm">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-tx-mid">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-tx-mid">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal underline">$1</a>')
    .replace(/\n\n/g, '</p><p class="text-sm text-tx-mid leading-relaxed mb-3">')
    .replace(/\n/g, '<br />')
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<ArticleFull | null>(null)
  const [related, setRelated] = useState<ArticleFull[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/articles/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setArticle(null); setLoading(false); return }
        setArticle(data)
        // Fetch related (same category)
        if (data.category) {
          fetch(`/api/articles?category=${data.category}&limit=4`)
            .then(r => r.json())
            .then(rel => setRelated((Array.isArray(rel) ? rel : []).filter((a: ArticleFull) => a.slug !== slug).slice(0, 3)))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
        <div className="h-[250px] bg-navy/10 animate-pulse" />
        <div className="px-5 py-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-navy/5 rounded animate-pulse" />)}
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center pb-[90px]">
        <p className="text-tx-light text-sm">Article not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-teal text-sm font-semibold">← Go back</button>
        <BottomNav />
      </div>
    )
  }

  const style = CATEGORY_STYLES[article.category ?? ''] ?? CATEGORY_STYLES.other

  function share() {
    if (navigator.share) {
      navigator.share({ title: article!.title, text: article!.excerpt ?? '', url: window.location.href })
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Hero */}
      {article.cover_image ? (
        <FocalImage src={article.cover_image} alt={article.title} className="w-full aspect-video object-cover" focalPoint={article.focal_x != null && article.focal_y != null ? { x: article.focal_x, y: article.focal_y } : null} />
      ) : (
        <div className="aspect-video flex items-center justify-center" style={{ background: style.bg }}>
          <span className="text-5xl">📖</span>
        </div>
      )}

      <div className="px-5 py-5 max-w-2xl mx-auto w-full">
        {/* Back */}
        <button
          onClick={() => window.history.length <= 1 ? router.push('/insights') : router.back()}
          className="text-[12px] font-semibold text-teal mb-3 block"
        >← Insights</button>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {article.category && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
              style={{ background: style.tagColor }}>{article.category.replace('_', ' ')}</span>
          )}
          <span className="text-xs text-tx-light">{relativeDate(article.published_at)}</span>
          {article.read_time_minutes && (
            <span className="text-xs text-tx-light">· {article.read_time_minutes} min read</span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl text-navy leading-tight mb-2">{article.title}</h1>
        {article.subtitle && <p className="text-base text-tx-mid mb-4">{article.subtitle}</p>}

        {/* Author */}
        <p className="text-xs text-tx-light mb-5">By {article.author}</p>

        {/* Body */}
        {article.body && (
          <div
            className="prose prose-sm max-w-none text-tx-mid leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-tx-mid leading-relaxed mb-3">${renderMarkdown(article.body)}</p>` }}
          />
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border-light">
            {article.tags.map(tag => (
              <span key={tag} className="text-[11px] text-tx-mid bg-sand px-2.5 py-1 rounded">{tag}</span>
            ))}
          </div>
        )}

        {/* Author bio */}
        {article.author_bio && (
          <div className="mt-6 p-4 bg-white border border-border-light rounded-sm">
            <p className="text-xs font-bold text-navy mb-1">{article.author}</p>
            <p className="text-xs text-tx-light leading-relaxed">{article.author_bio}</p>
          </div>
        )}

        {/* Share */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button onClick={share}
            className="mt-4 w-full py-3 border border-border rounded-sm text-sm font-semibold text-tx-mid hover:border-navy hover:text-navy transition-colors">
            Share this article
          </button>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg text-navy mb-4">More from Island Key</h3>
            <div className="space-y-3">
              {related.map(rel => (
                <button key={rel.id} onClick={() => router.push(`/insights/${rel.slug}`)}
                  className="w-full text-left flex gap-3 bg-white border border-border-light rounded-sm p-3 active:scale-[0.98] transition-transform">
                  {rel.cover_image ? (
                    <FocalImage src={rel.cover_image} alt={rel.title} className="w-16 h-12 object-cover rounded-sm flex-shrink-0" focalPoint={rel.focal_x != null && rel.focal_y != null ? { x: rel.focal_x, y: rel.focal_y } : null} />
                  ) : (
                    <div className="w-16 h-12 rounded-sm flex-shrink-0 flex items-center justify-center"
                      style={{ background: (CATEGORY_STYLES[rel.category ?? ''] ?? CATEGORY_STYLES.other).bg }}>
                      <span>📖</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-navy line-clamp-2 leading-snug">{rel.title}</h4>
                    {rel.read_time_minutes && <p className="text-[11px] text-tx-light mt-0.5">{rel.read_time_minutes} min read</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => window.history.length <= 1 ? router.push('/insights') : router.back()}
          className="mt-6 text-teal text-sm font-semibold">← Insights</button>
      </div>

      <BottomNav />
    </div>
  )
}
