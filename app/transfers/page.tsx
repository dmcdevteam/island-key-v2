'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileAvatar } from '@/app/_components/profile-avatar';
import { generateTimeSlots } from '@/lib/transfers';

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

type PlaceResult = {
  name:    string;
  address: string;
  placeId: string;
  lat:     number;
  lng:     number;
  isAirport: boolean;
};

function detectAirport(place: any): boolean {
  const types: string[] = place.types ?? [];
  const name  = (place.name ?? '').toLowerCase();
  return types.includes('airport') || name.includes('airport') || name.includes('αεροδρόμιο');
}

function placePrefix(place: PlaceResult) {
  return place.isAirport ? '✈ ' : '📍 ';
}

export default function TransfersSearchPage() {
  const router  = useRouter();
  const apiKey  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasKey  = !!apiKey;

  const [mapsReady, setMapsReady] = useState(false);
  const [from,  setFrom]  = useState<PlaceResult | null>(null);
  const [to,    setTo]    = useState<PlaceResult | null>(null);
  const [fromText, setFromText] = useState('');
  const [toText,   setToText]   = useState('');
  const [date,  setDate]  = useState('');
  const [time,  setTime]  = useState('10:00');
  const [pax,   setPax]   = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [searching, setSearching] = useState(false);

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef   = useRef<HTMLInputElement>(null);
  const fromAcRef = useRef<any>(null);
  const toAcRef   = useRef<any>(null);

  const slots = generateTimeSlots();

  // Load Google Maps script
  useEffect(() => {
    if (!hasKey || window.google?.maps?.places) { setMapsReady(!!window.google?.maps?.places); return; }
    window.initGoogleMaps = () => setMapsReady(true);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
    return () => { window.initGoogleMaps = undefined; };
  }, [apiKey, hasKey]);

  // Attach autocomplete
  useEffect(() => {
    if (!mapsReady || !fromRef.current || !toRef.current) return;
    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(34.8, 23.5),
      new window.google.maps.LatLng(35.7, 26.4),
    );

    function makeAc(input: HTMLInputElement, setter: (p: PlaceResult) => void, textSetter: (s: string) => void) {
      const ac = new window.google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'gr' },
        bounds,
        strictBounds: false,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
      });
      ac.addListener('place_changed', () => {
        const p = ac.getPlace();
        if (!p.geometry) return;
        const result: PlaceResult = {
          name:      p.name ?? '',
          address:   p.formatted_address ?? '',
          placeId:   p.place_id ?? '',
          lat:       p.geometry.location.lat(),
          lng:       p.geometry.location.lng(),
          isAirport: detectAirport(p),
        };
        setter(result);
        textSetter(placePrefix(result) + result.name);
      });
      return ac;
    }

    fromAcRef.current = makeAc(fromRef.current, setFrom, setFromText);
    toAcRef.current   = makeAc(toRef.current,   setTo,   setToText);
  }, [mapsReady]);

  const canSearch = date && (hasKey ? (from && to) : (fromText.trim() && toText.trim()));

  async function handleSearch() {
    if (!canSearch || searching) return;
    setSearching(true);

    let distanceKm = 0;
    let durationMin = 0;
    let isAirport = false;

    if (hasKey && from && to && window.google?.maps) {
      try {
        const svc    = new window.google.maps.DirectionsService();
        const result = await new Promise<any>((resolve, reject) =>
          svc.route({
            origin:      { placeId: from.placeId },
            destination: { placeId: to.placeId },
            travelMode:  window.google.maps.TravelMode.DRIVING,
          }, (r: any, s: string) => s === 'OK' ? resolve(r) : reject(s))
        );
        const leg  = result.routes[0]?.legs[0];
        distanceKm  = Math.round((leg?.distance?.value ?? 0) / 100) / 10;
        durationMin = Math.round((leg?.duration?.value ?? 0) / 60);
        isAirport   = from.isAirport || to.isAirport;
      } catch {
        // Directions failed — navigate anyway with zero distance (graceful)
      }
    }

    const params = new URLSearchParams({
      from_name: from?.name    ?? fromText,
      from_addr: from?.address ?? fromText,
      from_lat:  String(from?.lat  ?? ''),
      from_lng:  String(from?.lng  ?? ''),
      to_name:   to?.name    ?? toText,
      to_addr:   to?.address ?? toText,
      to_lat:    String(to?.lat  ?? ''),
      to_lng:    String(to?.lng  ?? ''),
      date,
      time,
      pax:       String(pax),
      luggage:   String(luggage),
      km:        String(distanceKm),
      dur:       String(durationMin),
      airport:   isAirport ? '1' : '0',
    });

    router.push(`/transfers/results?${params.toString()}`);
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
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
        {/* No-key banner */}
        {!hasKey && (
          <div className="w-full bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-2.5 mb-4 text-yellow-800 text-xs">
            Location search unavailable — type your location, we'll confirm the route.
          </div>
        )}

        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* From */}
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-3 h-3 rounded-full border-2 border-navy flex-shrink-0" />
              <input
                ref={fromRef}
                value={fromText}
                onChange={e => { setFromText(e.target.value); if (!hasKey) setFrom(null); }}
                placeholder="From — airport, port, address"
                className="flex-1 text-sm text-navy placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
            <div className="mx-4 border-t border-gray-100" />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-3 h-3 rounded-full bg-navy flex-shrink-0" />
              <input
                ref={toRef}
                value={toText}
                onChange={e => { setToText(e.target.value); if (!hasKey) setTo(null); }}
                placeholder="To — airport, port, address"
                className="flex-1 text-sm text-navy placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Date & time */}
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-base flex-shrink-0">📅</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="flex-1 text-sm text-navy outline-none bg-transparent"
            />
            <select
              value={time}
              onChange={e => setTime(e.target.value)}
              className="text-sm text-navy outline-none bg-transparent"
            >
              {slots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

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
    </div>
  );
}
