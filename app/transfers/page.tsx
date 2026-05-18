'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileAvatar } from '@/app/_components/profile-avatar';
import { generateTimeSlots } from '@/lib/transfers';
import { BottomNav } from '@/components/ui/bottom-nav';
import DateRangePicker, { toDate, fromDate } from '@/components/ui/date-range-picker';

type PlaceResult = {
  name:      string;
  address:   string;
  placeId:   string;
  lat:       number;
  lng:       number;
  isAirport: boolean;
};

type Suggestion = {
  place_id:    string;
  description: string;
  types:       string[];
};

function isAirport(types: string[], name: string): boolean {
  return types.includes('airport') ||
    name.toLowerCase().includes('airport') ||
    name.includes('αεροδρόμιο');
}

function placePrefix(p: PlaceResult) {
  return p.isAirport ? '✈ ' : '📍 ';
}

export default function TransfersSearchPage() {
  const router = useRouter();
  const slots  = generateTimeSlots();

  const [from,  setFrom]  = useState<PlaceResult | null>(null);
  const [to,    setTo]    = useState<PlaceResult | null>(null);
  const [fromText, setFromText] = useState('');
  const [toText,   setToText]   = useState('');
  const [date,  setDate]  = useState('');
  const [time,  setTime]  = useState('10:00');
  const [pax,   setPax]   = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [searching, setSearching] = useState(false);

  const [returnTrip, setReturnTrip] = useState(false);
  const [retDate, setRetDate] = useState('');
  const [retTime, setRetTime] = useState('10:00');

  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]);
  const [toSuggestions,   setToSuggestions]   = useState<Suggestion[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen,   setToOpen]   = useState(false);

  const fromTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(input: string, setter: (s: Suggestion[]) => void) {
    if (input.length < 2) { setter([]); return; }
    try {
      const res  = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setter(Array.isArray(data) ? data : []);
    } catch {
      setter([]);
    }
  }

  function onFromChange(v: string) {
    setFromText(v);
    setFrom(null);
    if (fromTimer.current) clearTimeout(fromTimer.current);
    fromTimer.current = setTimeout(() => fetchSuggestions(v, s => {
      setFromSuggestions(s);
      setFromOpen(s.length > 0);
    }), 300);
  }

  function onToChange(v: string) {
    setToText(v);
    setTo(null);
    if (toTimer.current) clearTimeout(toTimer.current);
    toTimer.current = setTimeout(() => fetchSuggestions(v, s => {
      setToSuggestions(s);
      setToOpen(s.length > 0);
    }), 300);
  }

  async function selectSuggestion(
    s: Suggestion,
    resultSetter: (p: PlaceResult) => void,
    textSetter:   (t: string) => void,
    closeFn:      () => void,
  ) {
    closeFn();
    try {
      const res  = await fetch(`/api/places/details?place_id=${encodeURIComponent(s.place_id)}`);
      const data = await res.json();
      if (data.error) return;
      const result: PlaceResult = {
        name:      data.name,
        address:   data.address,
        placeId:   data.place_id,
        lat:       data.lat,
        lng:       data.lng,
        isAirport: isAirport(data.types, data.name),
      };
      resultSetter(result);
      textSetter(placePrefix(result) + result.name);
    } catch { /* leave text as typed */ }
  }

  const canSearch = !!(date && from && to);

  async function handleSearch() {
    if (!canSearch || searching || !from || !to) return;
    setSearching(true);

    let distanceKm  = 0;
    let durationMin = 0;

    // DirectionsService stays client-side — display-only, no referrer issues
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (mapsKey && typeof window !== 'undefined') {
      try {
        // Lazy-load Maps JS only for directions (not for autocomplete)
        if (!window.google?.maps?.DirectionsService) {
          await new Promise<void>((resolve, reject) => {
            if (window.google?.maps?.DirectionsService) { resolve(); return; }
            const cb = '__ikDirCb';
            (window as any)[cb] = resolve;
            const s = document.createElement('script');
            s.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&callback=${cb}`;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        const svc    = new window.google.maps.DirectionsService();
        const result = await new Promise<any>((resolve, reject) =>
          svc.route({
            origin:      { placeId: from.placeId },
            destination: { placeId: to.placeId },
            travelMode:  window.google.maps.TravelMode.DRIVING,
          }, (r: any, status: string) => status === 'OK' ? resolve(r) : reject(status))
        );
        const leg    = result.routes[0]?.legs[0];
        distanceKm   = Math.round((leg?.distance?.value ?? 0) / 100) / 10;
        durationMin  = Math.round((leg?.duration?.value ?? 0) / 60);
      } catch {
        // Directions failed — continue without distance
      }
    }

    const params = new URLSearchParams({
      from_name: from.name,
      from_addr: from.address,
      from_lat:  String(from.lat),
      from_lng:  String(from.lng),
      to_name:   to.name,
      to_addr:   to.address,
      to_lat:    String(to.lat),
      to_lng:    String(to.lng),
      date,
      time,
      pax:       String(pax),
      luggage:   String(luggage),
      km:        String(distanceKm),
      dur:       String(durationMin),
      airport:   (from.isAirport || to.isAirport) ? '1' : '0',
    });

    if (returnTrip && retDate) {
      params.set('ret_date', retDate);
      params.set('ret_time', retTime);
    }

    router.push(`/transfers/results?${params.toString()}`);
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <h1 className="font-display text-xl font-medium text-white">Transfers</h1>
        </div>
        <ProfileAvatar />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-start px-5 pb-10">
        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-visible">

          {/* From */}
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-3 h-3 rounded-full border-2 border-navy flex-shrink-0" />
              <input
                value={fromText}
                onChange={e => onFromChange(e.target.value)}
                onFocus={() => fromSuggestions.length > 0 && setFromOpen(true)}
                onBlur={() => setTimeout(() => setFromOpen(false), 150)}
                placeholder="From — airport, port, address"
                className="flex-1 text-sm text-navy placeholder-gray-400 outline-none bg-transparent"
                autoComplete="off"
              />
            </div>

            {/* From dropdown */}
            {fromOpen && fromSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white border border-gray-100 rounded-b-xl shadow-xl z-50 overflow-hidden">
                {fromSuggestions.map(s => (
                  <button
                    key={s.place_id}
                    onMouseDown={() => selectSuggestion(s, setFrom, setFromText, () => { setFromOpen(false); setFromSuggestions([]); })}
                    className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
                  >
                    <span className="text-gray-400 flex-shrink-0 mt-px">
                      {s.types.includes('airport') ? '✈' : '📍'}
                    </span>
                    <span className="truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mx-4 border-t border-gray-100" />

            {/* To */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-3 h-3 rounded-full bg-navy flex-shrink-0" />
              <input
                value={toText}
                onChange={e => onToChange(e.target.value)}
                onFocus={() => toSuggestions.length > 0 && setToOpen(true)}
                onBlur={() => setTimeout(() => setToOpen(false), 150)}
                placeholder="To — airport, port, address"
                className="flex-1 text-sm text-navy placeholder-gray-400 outline-none bg-transparent"
                autoComplete="off"
              />
            </div>

            {/* To dropdown */}
            {toOpen && toSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white border border-gray-100 rounded-b-xl shadow-xl z-50 overflow-hidden">
                {toSuggestions.map(s => (
                  <button
                    key={s.place_id}
                    onMouseDown={() => selectSuggestion(s, setTo, setToText, () => { setToOpen(false); setToSuggestions([]); })}
                    className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
                  >
                    <span className="text-gray-400 flex-shrink-0 mt-px">
                      {s.types.includes('airport') ? '✈' : '📍'}
                    </span>
                    <span className="truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Date & time */}
          <div className="px-4 py-3 space-y-2">
            <DateRangePicker
              singleDate
              startDate={toDate(date)}
              endDate={null}
              onChange={(s) => setDate(fromDate(s))}
              placeholder="Select date"
            />
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-gray-400 flex-shrink-0">Time</span>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="flex-1 text-sm text-navy outline-none bg-transparent"
              >
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Return trip toggle */}
          {!returnTrip ? (
            <button
              onClick={() => setReturnTrip(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-teal font-medium"
            >
              <span className="text-base leading-none">↩</span>
              <span>+ Add return trip</span>
            </button>
          ) : (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-navy">Return trip</span>
                <button
                  onClick={() => { setReturnTrip(false); setRetDate(''); }}
                  className="text-xs text-tx-light hover:text-navy"
                >Remove ✕</button>
              </div>
              <div className="space-y-2">
                <DateRangePicker
                  singleDate
                  startDate={toDate(retDate)}
                  endDate={null}
                  onChange={(s) => setRetDate(fromDate(s))}
                  placeholder="Return date"
                  minDate={toDate(date) ?? undefined}
                />
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-400 flex-shrink-0">Return time</span>
                  <select
                    value={retTime}
                    onChange={e => setRetTime(e.target.value)}
                    className="flex-1 text-sm text-navy outline-none bg-transparent"
                  >
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100" />

          {/* Pax & luggage */}
          <div className="flex items-center divide-x divide-gray-100">
            <div className="flex-1 flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-500">👤 Passengers</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPax(p => Math.max(1, p - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-navy text-base leading-none">−</button>
                <span className="text-sm font-semibold text-navy w-4 text-center">{pax}</span>
                <button onClick={() => setPax(p => Math.min(16, p + 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-navy text-base leading-none">+</button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-500">🧳 Luggage</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setLuggage(l => Math.max(0, l - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-navy text-base leading-none">−</button>
                <span className="text-sm font-semibold text-navy w-4 text-center">{luggage}</span>
                <button onClick={() => setLuggage(l => Math.min(20, l + 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-navy text-base leading-none">+</button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Search button */}
          <div className="p-4">
            <button
              onClick={handleSearch}
              disabled={!canSearch || searching}
              className="w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
            >
              {searching ? 'Searching…' : 'Search transfers →'}
            </button>
          </div>
        </div>

        <p className="mt-5 text-white/40 text-xs text-center">
          Private transfers across Crete · Confirmed within 2 hours
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
