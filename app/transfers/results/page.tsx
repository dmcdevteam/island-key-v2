'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VEHICLE_IMAGES, VEHICLE_LABELS, VEHICLE_CAPACITY, VEHICLE_EXAMPLES,
  VEHICLE_ORDER, calculateP2PPrice, parseDbFormulas, formatTransferDate,
  addMinutes, type VehicleSlug, type VehicleFormula,
} from '@/lib/transfers';
import { whatsappLink } from '@/lib/utils';

declare global { interface Window { google: any } }

// Map styles: clean, minimal, navy accent
const MAP_STYLES = [
  { featureType: 'poi',        elementType: 'labels',     stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',    elementType: 'all',        stylers: [{ visibility: 'off' }] },
  { featureType: 'road',       elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water',      elementType: 'geometry',   stylers: [{ color: '#b8d4e3' }] },
  { featureType: 'landscape',  elementType: 'geometry',   stylers: [{ color: '#f0ede8' }] },
];

function ResultsContent() {
  const router = useRouter();
  const sp     = useSearchParams();

  const fromName = sp.get('from_name') ?? '';
  const fromAddr = sp.get('from_addr') ?? '';
  const fromLat  = parseFloat(sp.get('from_lat') ?? '35.32');
  const fromLng  = parseFloat(sp.get('from_lng') ?? '25.13');
  const toName   = sp.get('to_name') ?? '';
  const toAddr   = sp.get('to_addr') ?? '';
  const toLat    = parseFloat(sp.get('to_lat') ?? '35.51');
  const toLng    = parseFloat(sp.get('to_lng') ?? '24.01');
  const date     = sp.get('date') ?? '';
  const time     = sp.get('time') ?? '';
  const pax      = sp.get('pax') ?? '1';
  const luggage  = sp.get('luggage') ?? '1';
  const km       = parseFloat(sp.get('km') ?? '0');
  const dur      = parseInt(sp.get('dur') ?? '0');
  const isAirport = sp.get('airport') === '1';

  const [formulas, setFormulas] = useState<Record<string, VehicleFormula> | null>(null);
  const [selected, setSelected] = useState<VehicleSlug | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fetch DB formulas
  useEffect(() => {
    fetch('/api/transfers/pricing')
      .then(r => r.json())
      .then(rows => setFormulas(parseDbFormulas(rows)))
      .catch(() => setFormulas(null));
  }, []);

  // Load map
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) { setMapsReady(true); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.onload = () => setMapsReady(true);
    document.head.appendChild(s);
  }, [apiKey]);

  // Draw route on map
  useEffect(() => {
    if (!mapsReady || !mapRef.current || !fromLat || !toLat) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 9,
      center: { lat: (fromLat + toLat) / 2, lng: (fromLng + toLng) / 2 },
      disableDefaultUI: true,
      styles: MAP_STYLES,
    });

    const directionsService  = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#1A8A7D', strokeWeight: 4, strokeOpacity: 0.85 },
    });

    directionsService.route(
      {
        origin:      { lat: fromLat, lng: fromLng },
        destination: { lat: toLat,   lng: toLng   },
        travelMode:  window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
        // Custom markers
        new window.google.maps.Marker({
          position: { lat: fromLat, lng: fromLng },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8, fillColor: '#1A8A7D', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
          },
        });
        new window.google.maps.Marker({
          position: { lat: toLat, lng: toLng },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8, fillColor: '#1B2D4F', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
          },
        });
      },
    );
  }, [mapsReady, fromLat, fromLng, toLat, toLng]);

  function getPrice(slug: VehicleSlug): number {
    if (km <= 0) return 0;
    return calculateP2PPrice(km, slug, isAirport, formulas ?? undefined);
  }

  const estArrival = dur > 0 ? addMinutes(time, dur) : '';

  const eligibleVehicles = VEHICLE_ORDER.filter(slug => {
    const cap = VEHICLE_CAPACITY[slug];
    return Number(pax) <= cap.pax && Number(luggage) <= cap.luggage;
  });

  const returnWaLink = whatsappLink(
    `Hi, I'd like to add a return transfer to my booking.\nRoute: ${toName} → ${fromName}.\nReference: (to be assigned)`
  );

  function handleSelect(slug: VehicleSlug) {
    const price = getPrice(slug);
    const params = new URLSearchParams(sp.toString());
    params.set('vehicle', slug);
    params.set('price', String(price));
    router.push(`/transfers/booking?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-tx-mid">← Back</button>
        <h1 className="font-display text-lg font-medium text-navy">Select vehicle</h1>
      </div>

      {/* Route timeline */}
      <div className="mx-5 mb-4 bg-white rounded-2xl border border-border-light p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 mt-1 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-teal" />
            <div className="w-px h-6 bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-navy" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy leading-tight">{fromName}</p>
                <span className="text-xs font-semibold text-teal ml-2 flex-shrink-0">{time}</span>
              </div>
              {fromAddr && fromAddr !== fromName && (
                <p className="text-xs text-tx-light mt-0.5 leading-tight">{fromAddr}</p>
              )}
              {(km > 0 || dur > 0) && (
                <p className="text-[11px] text-tx-light mt-1">
                  {dur > 0 ? `~${Math.floor(dur / 60)}h ${dur % 60}min` : ''}{km > 0 ? ` · ~${km} km` : ''}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy leading-tight">{toName}</p>
                {estArrival && <span className="text-xs text-tx-light ml-2 flex-shrink-0">est. {estArrival}</span>}
              </div>
              {toAddr && toAddr !== toName && (
                <p className="text-xs text-tx-light mt-0.5 leading-tight">{toAddr}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>{formatTransferDate(date)} · {pax} passenger{Number(pax) !== 1 ? 's' : ''} · {luggage} bag{Number(luggage) !== 1 ? 's' : ''}</span>
          <button
            onClick={() => router.back()}
            className="text-teal font-medium underline underline-offset-2"
          >Edit</button>
        </div>
      </div>

      {/* Map */}
      <div className="mx-5 mb-2 rounded-2xl overflow-hidden border border-border-light">
        {apiKey ? (
          <div ref={mapRef} style={{ height: 320 }} className="w-full bg-gray-100" />
        ) : (
          <div style={{ height: 200 }} className="w-full bg-navy/5 flex items-center justify-center">
            <div className="text-center text-tx-light text-sm px-4">
              <p className="text-2xl mb-2">🗺</p>
              <p className="font-medium">{fromName} → {toName}</p>
              {km > 0 && <p className="text-xs mt-1">~{km} km · ~{dur} min</p>}
            </div>
          </div>
        )}
      </div>

      <p className="px-5 mb-4 text-xs text-tx-light">All prices include taxes &amp; fees</p>

      {/* Vehicle cards */}
      <div className="px-5 space-y-3">
        {eligibleVehicles.length === 0 && (
          <div className="bg-white rounded-2xl border border-border-light p-6 text-center space-y-3">
            <p className="text-2xl">🚌</p>
            <p className="text-sm font-semibold text-navy">No vehicles available for this group size</p>
            <p className="text-xs text-tx-light">For groups this size, please contact us via WhatsApp.</p>
            <a
              href={whatsappLink(`Hi, I need a transfer for ${pax} passengers and ${luggage} bags.\nRoute: ${fromName} → ${toName}\nDate: ${date} at ${time}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-4 py-2 bg-[#25D366] text-white text-sm font-semibold rounded-xl"
            >
              Contact us on WhatsApp
            </a>
          </div>
        )}
        {eligibleVehicles.map((slug, idx) => {
          const cap   = VEHICLE_CAPACITY[slug];
          const price = getPrice(slug);
          const isBest = idx === 0;

          return (
            <div
              key={slug}
              className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm"
            >
              <div className="flex gap-0">
                {/* Vehicle image */}
                <div className="relative flex-shrink-0" style={{ width: 110 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={VEHICLE_IMAGES[slug]}
                    alt={VEHICLE_LABELS[slug]}
                    className="w-full h-full object-cover"
                    style={{ height: 110 }}
                  />
                  {isBest && (
                    <span className="absolute top-2 left-2 bg-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                      BEST VALUE
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col p-3 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-navy text-sm">{VEHICLE_LABELS[slug]}</p>
                    {price > 0 ? (
                      <p className="text-base font-bold text-navy flex-shrink-0">€{price}</p>
                    ) : (
                      <p className="text-xs text-tx-light flex-shrink-0">Enquire</p>
                    )}
                  </div>
                  <p className="text-xs text-tx-light mt-0.5">
                    Up to {cap.pax} 👤 · {cap.luggage} 🧳
                  </p>
                  <p className="text-[11px] text-tx-light mt-0.5 truncate">{VEHICLE_EXAMPLES[slug]}</p>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleSelect(slug)}
                    className="mt-2 self-end bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Select →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom summary */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border-light px-5 py-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>✓ Free cancellation up to 24h</span>
          <span>✓ Confirmed within 2 hours</span>
        </div>
        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>✓ Flight delays? We adjust</span>
          <a href={returnWaLink} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-medium">
            + Add return trip
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TransferResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center text-tx-light text-sm">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
