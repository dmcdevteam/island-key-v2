'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { ProfileAvatar } from '@/app/_components/profile-avatar'
import type { Service } from '@/lib/types'

const MOODS = [
  { key: 'relax_restore',   label: 'Relax & Restore',   icon: '🧘' },
  { key: 'family_time',     label: 'Family Time',        icon: '👨‍👩‍👧' },
  { key: 'celebrate',       label: 'Celebrate',          icon: '🥂' },
  { key: 'indulge',         label: 'Indulge',            icon: '✨' },
  { key: 'active_fit',      label: 'Active & Fit',       icon: '💪' },
  { key: 'host_entertain',  label: 'Host & Entertain',   icon: '🎵' },
]

const SUBCATEGORY_LABELS: Record<string, string> = {
  wellness_health:        'Wellness & Health',
  family_care:            'Family & Care',
  food_dining:            'Food & Dining',
  villa_lifestyle:        'Villa & Lifestyle',
  private_experiences:    'Private Experiences',
  beach_dining_nightlife: 'Beach, Dining & Nightlife',
  lifestyle_shopping:     'Lifestyle & Shopping',
  events_access:          'Events & Access',
}

export default function ServicesPage() {
  const router = useRouter()
  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [moodServices, setMoodServices] = useState<Service[]>([])
  const [moodLoading, setMoodLoading] = useState(false)

  useEffect(() => {
    if (!activeMood) { setMoodServices([]); return }
    setMoodLoading(true)
    fetch(`/api/services?mood=${activeMood}`)
      .then(r => r.json())
      .then(d => { setMoodServices(Array.isArray(d.services) ? d.services : []); setMoodLoading(false) })
      .catch(() => setMoodLoading(false))
  }, [activeMood])

  function toggleMood(key: string) {
    setActiveMood(prev => prev === key ? null : key)
  }

  const activeMoodLabel = MOODS.find(m => m.key === activeMood)?.label ?? ''

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
            <h1 className="font-display text-xl font-medium text-navy">Services</h1>
          </div>
          <ProfileAvatar />
        </div>
        <p className="text-xs text-tx-light mt-0.5">In-house professionals and curated access — delivered to your villa</p>
      </div>

      {/* Mood filter */}
      <div className="px-5 mb-4 flex-shrink-0">
        <p className="text-[10px] font-semibold text-tx-light uppercase tracking-wide mb-1.5">What are you looking for?</p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMood(null)}
            className={`px-3 py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
              activeMood === null
                ? 'bg-teal/10 text-teal border-teal/40'
                : 'bg-transparent text-tx-light border-border-light hover:border-teal/30 hover:text-teal'
            }`}
          >
            All
          </button>
          {MOODS.map(m => (
            <button
              key={m.key}
              onClick={() => toggleMood(m.key)}
              className={`px-3 py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                activeMood === m.key
                  ? 'bg-teal/10 text-teal border-teal/40'
                  : 'bg-transparent text-tx-light border-border-light hover:border-teal/30 hover:text-teal'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {/* Two main category cards */}
        <button
          onClick={() => router.push('/services/in-house')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800"
            alt="In-House Services"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">In-House Services</p>
            <p className="text-[13px] text-white/75 mt-1">Professionals delivered to your door</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        <button
          onClick={() => router.push('/services/reservations')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
            alt="Reservations & Access"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">Reservations &amp; Access</p>
            <p className="text-[13px] text-white/75 mt-1">The best seats, tables and stages in Crete</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        <button
          onClick={() => router.push('/services/localize')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800"
            alt="Localize"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">Localize</p>
            <p className="text-[13px] text-white/75 mt-1">Shuffle with locals — classes, groups and community experiences</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        {/* Mood results — only shown when a mood is active */}
        {activeMood && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-navy mb-3">{activeMoodLabel} Services</p>

            {moodLoading && (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map(i => <div key={i} className="h-[120px] rounded-sm bg-navy/5 animate-pulse" />)}
              </div>
            )}

            {!moodLoading && moodServices.length === 0 && (
              <p className="text-sm text-tx-light text-center py-8">No services matching this mood yet.</p>
            )}

            {!moodLoading && moodServices.length > 0 && (
              <div className="flex flex-col gap-3">
                {moodServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/services/${s.slug}`)}
                    className="w-full text-left bg-white rounded-sm border border-border-light overflow-hidden active:scale-[0.98] transition-transform"
                  >
                    {(s.image_wide ?? s.images?.[0]) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.image_wide ?? s.images![0]}
                        alt={s.title}
                        className="w-full h-[140px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[140px] bg-navy/10 flex items-center justify-center">
                        <span className="text-3xl">🛎️</span>
                      </div>
                    )}
                    <div className="p-3.5">
                      {s.subcategory && (
                        <span className="text-[10px] font-bold uppercase text-teal tracking-wide">
                          {SUBCATEGORY_LABELS[s.subcategory] ?? s.subcategory}
                        </span>
                      )}
                      <h3 className="font-display text-base text-navy mt-0.5 leading-tight">{s.title}</h3>
                      {s.short_description && (
                        <p className="text-xs text-tx-light mt-1 line-clamp-2">{s.short_description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-terra">
                          {s.price_label ?? (s.price_from ? `from €${s.price_from}` : 'Price on request')}
                        </span>
                        <span className="text-xs font-semibold text-teal">Enquire →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
