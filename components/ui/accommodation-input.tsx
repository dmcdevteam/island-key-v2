'use client'

import { useRef, useState } from 'react'

type Suggestion  = { place_id: string; description: string; types: string[] }
type PlaceResult = { display_name: string; formatted_address: string; place_id: string; lat: number; lng: number }

interface Props {
  initialValue: string
  onSelect: (p: PlaceResult) => void
}

export function AccommodationInput({ initialValue, onSelect }: Props) {
  const [text,        setText]        = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [confirmed,   setConfirmed]   = useState<PlaceResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSuggestions(input: string) {
    if (input.length < 2) { setSuggestions([]); return }
    try {
      const res  = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
    } catch { setSuggestions([]) }
  }

  function handleChange(v: string) {
    setText(v)
    setConfirmed(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetchSuggestions(v).then(() => setOpen(true))
    }, 300)
  }

  async function selectSuggestion(s: Suggestion) {
    setOpen(false)
    setSuggestions([])
    setText(s.description)
    try {
      const res  = await fetch(`/api/places/details?place_id=${encodeURIComponent(s.place_id)}`)
      const data = await res.json()
      if (!data.error) {
        const result: PlaceResult = {
          display_name:      data.name || s.description,
          formatted_address: data.formatted_address || s.description,
          place_id:          data.place_id,
          lat:               data.lat,
          lng:               data.lng,
        }
        setText(result.display_name)
        setConfirmed(result)
        onSelect(result)
      }
    } catch { /* keep typed text */ }
  }

  return (
    <div className="relative">
      <input
        value={text}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search for your accommodation…"
        autoComplete="off"
        className="w-full px-3 py-2.5 border border-border-light rounded-xl text-sm text-navy bg-white outline-none focus:border-navy/40 transition-colors"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border-light rounded-xl shadow-xl z-50 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.place_id}
              onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
            >
              <span className="text-gray-400 flex-shrink-0 mt-px">
                {s.types.includes('lodging') ? '🏨' : '📍'}
              </span>
              <span className="truncate">{s.description}</span>
            </button>
          ))}
        </div>
      )}
      {confirmed && (
        <p className="text-[11px] text-teal mt-1.5 flex items-center gap-1">
          <span>📍</span>
          <span>{confirmed.formatted_address}</span>
        </p>
      )}
    </div>
  )
}
