'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type SearchResult = {
  activities: any[]
  services:   any[]
  rentals:    any[]
  events:     any[]
}

const POPULAR_SEARCHES = [
  'Private chef',
  'Airport transfer',
  'Sailing',
  'Car rental',
  'Massage',
  'Boat trip',
]

const SECTION_ICONS: Record<string, string> = {
  activities: '🧭',
  services:   '🛎️',
  rentals:    '🚙',
  events:     '🎉',
}

const SECTION_LABELS: Record<string, string> = {
  activities: 'Activities',
  services:   'Services',
  rentals:    'Rentals',
  events:     'Events',
}

function priceLabel(item: any, section: string): string | null {
  if (section === 'activities' || section === 'services' || section === 'events') {
    const p = item.price_from
    if (item.is_free) return 'Free'
    if (p != null) return `From €${p}`
  }
  if (section === 'rentals' && item.price_per_day != null) {
    return `€${item.price_per_day}/day`
  }
  return null
}

function resultUrl(item: any, section: string): string {
  if (section === 'activities' && item.slug) return `/activities/${item.slug}`
  if (section === 'events'     && item.slug) return `/events/${item.slug}`
  if (section === 'services') {
    const cat = item.category ?? 'in_house'
    const sub = item.subcategory ?? ''
    if (sub) return `/services/${cat}/${sub}`
    return `/services/${cat}`
  }
  if (section === 'rentals') {
    return `/rentals/cars/results?category=${encodeURIComponent(item.type ?? 'car')}`
  }
  return '/'
}

function resultDescription(item: any, section: string): string {
  if (section === 'activities') return item.description ?? item.category ?? ''
  if (section === 'services')   return item.short_description ?? item.service_type ?? item.subcategory ?? ''
  if (section === 'rentals')    return item.description ?? `${item.car_class ?? item.type ?? ''}`
  if (section === 'events')     return item.description ?? item.category ?? ''
  return ''
}

interface Props {
  onClose: () => void
}

export function GlobalSearch({ onClose }: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function runSearch(q: string) {
    if (q.length < 2) {
      setResults(null)
      setSearched('')
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.results)
        setSearched(data.query)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function handleInput(val: string) {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current  = setTimeout(() => runSearch(val), 300)
  }

  function handleChip(chip: string) {
    setQuery(chip)
    runSearch(chip)
  }

  function handleResultTap(item: any, section: string) {
    router.push(resultUrl(item, section))
    onClose()
  }

  const sections = ['activities', 'services', 'rentals', 'events'] as const
  const hasResults = results && sections.some(s => results[s].length > 0)
  const noResults  = searched.length >= 2 && results && !hasResults

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col max-w-[480px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light flex-shrink-0">
        <button
          onClick={onClose}
          className="text-tx-light text-xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
          aria-label="Back"
        >
          ←
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search activities, services, rentals..."
          className="flex-1 text-sm text-navy outline-none bg-transparent placeholder:text-tx-light"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setSearched(''); inputRef.current?.focus() }}
            className="text-tx-light text-xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No results */}
        {!loading && noResults && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-navy mb-1">No results for &ldquo;{searched}&rdquo;</p>
            <p className="text-xs text-tx-light">Try browsing categories below</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && sections.map(section => {
          const items = results[section]
          if (!items.length) return null
          return (
            <div key={section} className="border-b border-border-light last:border-0">
              <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold text-tx-light uppercase tracking-widest">
                {SECTION_ICONS[section]} {SECTION_LABELS[section]}
              </p>
              {items.map((item: any) => {
                const desc  = resultDescription(item, section)
                const price = priceLabel(item, section)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleResultTap(item, section)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sand active:bg-sand/70 transition-colors"
                  >
                    {item.image_square ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_square}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0 text-base">
                        {SECTION_ICONS[section]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{item.title ?? item.name}</p>
                      {desc && (
                        <p className="text-xs text-tx-light truncate">{desc}</p>
                      )}
                    </div>
                    {price && (
                      <span className="text-xs text-teal font-semibold flex-shrink-0">{price}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}

        {/* Initial state — popular searches */}
        {!loading && !results && (
          <div className="px-5 pt-6">
            <p className="text-[10px] font-bold text-tx-light uppercase tracking-widest mb-3">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="px-4 py-2 rounded-full border border-border-light text-sm text-navy bg-white hover:border-navy/40 active:bg-sand transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
