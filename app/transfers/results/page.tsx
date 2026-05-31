'use client';

import { Fragment, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VEHICLE_LABELS, VEHICLE_CAPACITY, VEHICLE_EXAMPLES,
  VEHICLE_ORDER, calculateP2PPrice, parseDbFormulas, formatTransferDate,
  addMinutes, getVehicleImage, type VehicleSlug, type VehicleFormula,
} from '@/lib/transfers';
import { whatsappLink } from '@/lib/utils';
import { generateTimeSlots } from '@/lib/transfers';

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
  const retDate  = sp.get('ret_date') ?? '';
  const retTime  = sp.get('ret_time') ?? '';
  const hasReturn = !!retDate;

  const [formulas,     setFormulas]     = useState<Record<string, VehicleFormula> | null>(null);
  const [vtImages,     setVtImages]     = useState<Record<string, string | null>>({});
  const [vtExamples,   setVtExamples]   = useState<Record<string, string | null>>({});
  // Preset prices keyed by vehicle slug: { price, original_price, discount_label }
  const [presetPrices, setPresetPrices] = useState<Record<string, { price: number; original_price: number | null; discount_label: string | null }> | null>(null);
  const [returnPricing, setReturnPricing] = useState<{ mode: string; discount_percent: number; display_mode: string; discount_label: string | null }>({ mode: 'same', discount_percent: 100, display_mode: 'per_leg_and_total', discount_label: null });
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Return trip upsell picker state
  const slots = generateTimeSlots();
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [bannerRetDate, setBannerRetDate] = useState('');
  const [bannerRetTime, setBannerRetTime] = useState('10:00');

  // Fetch DB formulas + vehicle type overrides + preset prices
  useEffect(() => {
    fetch('/api/transfers/pricing')
      .then(r => r.json())
      .then((json: { formulas?: any[]; vehicleTypes?: any[]; presetRoutes?: any[]; returnPricing?: any }) => {
        setFormulas(parseDbFormulas(json.formulas ?? []));
        if (json.returnPricing) setReturnPricing(json.returnPricing);
        // Build slug-keyed maps for image/examples from vehicle_types rows
        const images:   Record<string, string | null> = {};
        const examples: Record<string, string | null> = {};
        for (const vt of (json.vehicleTypes ?? [])) {
          const slug = vt.slug ?? vt.category
            ?? vt.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
          if (slug) {
            images[slug]   = vt.image_url    ?? null;
            examples[slug] = vt.example_models ?? null;
          }
        }
        setVtImages(images);
        setVtExamples(examples);

        // Check if current from/to matches a preset route
        const norm = (s: string) => s.toLowerCase().trim();
        const matchedRoute = (json.presetRoutes ?? []).find((r: any) => {
          const fromMatch = norm(fromName).includes(norm(r.from_location)) || norm(r.from_location).includes(norm(fromName));
          const toMatch   = norm(toName).includes(norm(r.to_location))   || norm(r.to_location).includes(norm(toName));
          return fromMatch && toMatch;
        });
        if (matchedRoute) {
          const presetMap: Record<string, { price: number; original_price: number | null; discount_label: string | null }> = {};
          for (const tp of (matchedRoute.transfer_prices ?? [])) {
            const slug = tp.vehicle_types?.slug;
            if (slug) presetMap[slug] = { price: tp.price, original_price: tp.original_price ?? null, discount_label: tp.discount_label ?? null };
          }
          setPresetPrices(presetMap);
        }
      })
      .catch(() => setFormulas(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      polylineOptions: { strokeColor: '#C8F135', strokeWeight: 4, strokeOpacity: 0.85 },
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
            scale: 8, fillColor: '#C8F135', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
          },
        });
        new window.google.maps.Marker({
          position: { lat: toLat, lng: toLng },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8, fillColor: '#0D0D0D', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
          },
        });
      },
    );
  }, [mapsReady, fromLat, fromLng, toLat, toLng]);

  function getPrice(slug: VehicleSlug): number {
    if (presetPrices?.[slug]) return presetPrices[slug].price;
    if (km <= 0) return 0;
    return calculateP2PPrice(km, slug, isAirport, formulas ?? undefined);
  }

  function getDiscount(slug: VehicleSlug): { original_price: number | null; discount_label: string | null } {
    return {
      original_price: presetPrices?.[slug]?.original_price ?? null,
      discount_label: presetPrices?.[slug]?.discount_label ?? null,
    };
  }

  function getReturnPrice(slug: VehicleSlug): number {
    const outbound = getPrice(slug);
    if (returnPricing.mode === 'discount') {
      return Math.round(outbound * (1 - returnPricing.discount_percent / 100));
    }
    return outbound;
  }

  const estArrival = dur > 0 ? addMinutes(time, dur) : '';

  const eligibleVehicles = VEHICLE_ORDER.filter(slug => {
    const cap = VEHICLE_CAPACITY[slug];
    return Number(pax) <= cap.pax && Number(luggage) <= cap.luggage;
  });

  function handleSelect(slug: VehicleSlug) {
    const price = getPrice(slug);
    const params = new URLSearchParams(sp.toString());
    params.set('vehicle', slug);
    params.set('price', String(price));
    router.push(`/transfers/booking?${params.toString()}`);
  }

  function applyReturnTrip() {
    if (!bannerRetDate) return;
    const newParams = new URLSearchParams(sp.toString());
    newParams.set('ret_date', bannerRetDate);
    newParams.set('ret_time', bannerRetTime);
    router.replace(`/transfers/results?${newParams.toString()}`);
    setShowReturnPicker(false);
  }

  function removeReturnTrip() {
    const newParams = new URLSearchParams(sp.toString());
    newParams.delete('ret_date');
    newParams.delete('ret_time');
    router.replace(`/transfers/results?${newParams.toString()}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-tx-mid">← Back</button>
        <h1 className="font-display text-lg font-light text-ink">Select vehicle</h1>
      </div>

      {/* Route timeline */}
      <div className="mx-5 mb-4 bg-white rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 mt-1 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-lime" />
            <div className="w-px h-6 bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-ink" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink leading-tight">{fromName}</p>
                <span className="text-xs font-semibold text-ink ml-2 flex-shrink-0">{time}</span>
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
                <p className="text-sm font-semibold text-ink leading-tight">{toName}</p>
                {estArrival && <span className="text-xs text-tx-light ml-2 flex-shrink-0">est. {estArrival}</span>}
              </div>
              {toAddr && toAddr !== toName && (
                <p className="text-xs text-tx-light mt-0.5 leading-tight">{toAddr}</p>
              )}
            </div>
          </div>
        </div>

        {/* Return trip indicator */}
        {hasReturn && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2 text-xs text-ink font-medium">
              <span>↩</span>
              <span>Return: {formatTransferDate(retDate)} · {retTime}</span>
            </div>
            <button onClick={removeReturnTrip} className="text-xs text-tx-light">Remove</button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>{formatTransferDate(date)} · {pax} passenger{Number(pax) !== 1 ? 's' : ''} · {luggage} bag{Number(luggage) !== 1 ? 's' : ''}</span>
          <button
            onClick={() => router.back()}
            className="text-ink font-medium underline underline-offset-2"
          >Edit</button>
        </div>
      </div>

      {/* Map */}
      <div className="mx-5 mb-2 rounded-2xl overflow-hidden border border-border">
        {apiKey ? (
          <div ref={mapRef} style={{ height: 320 }} className="w-full bg-mist" />
        ) : (
          <div style={{ height: 200 }} className="w-full bg-mist flex items-center justify-center">
            <div className="text-center text-tx-light text-sm px-4">
              <p className="text-2xl mb-2">🗺</p>
              <p className="font-medium">{fromName} → {toName}</p>
              {km > 0 && <p className="text-xs mt-1">~{km} km · ~{dur} min</p>}
            </div>
          </div>
        )}
      </div>

      <p className="px-5 mb-3 text-xs text-tx-light">All prices include taxes &amp; fees{hasReturn ? ' · Both legs' : ''}</p>

      {/* Persistent return trip row */}
      <div className="mx-5 mb-4">
        <button
          onClick={() => { setBannerRetDate(retDate || ''); setBannerRetTime(retTime || '10:00'); setShowReturnPicker(true); }}
          style={{
            width: '100%', height: 44, borderRadius: 10,
            background: '#FAFAFA', border: '1px solid #E8E4DC',
            display: 'flex', alignItems: 'center',
            paddingLeft: 12, paddingRight: 12, gap: 8,
            cursor: 'pointer',
          }}
        >
          <span style={{ color: '#0D0D0D', fontSize: 16, flexShrink: 0 }}>↔</span>
          <span style={{ flex: 1, fontSize: 13, color: '#0D0D0D', textAlign: 'left' }}>
            {hasReturn ? `Return: ${formatTransferDate(retDate)} at ${retTime}` : 'One way · Add return trip'}
          </span>
          <span style={{ color: '#0D0D0D', fontSize: 13, fontWeight: 600 }}>
            {hasReturn ? 'edit' : '+'}
          </span>
        </button>
      </div>

      {/* Vehicle cards */}
      <div className="px-5 space-y-3">
        {eligibleVehicles.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 text-center space-y-3">
            <p className="text-2xl">🚌</p>
            <p className="text-sm font-semibold text-ink">No vehicles available for this group size</p>
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
          const { original_price, discount_label } = getDiscount(slug);
          const isBest = idx === 0;
          const returnPrice = hasReturn ? getReturnPrice(slug) : 0;
          const totalPrice  = hasReturn ? price + returnPrice : price;

          return (
            <Fragment key={slug}>
              <div
                className="bg-white rounded-2xl border border-border overflow-hidden"
              >
                <div className="flex gap-0">
                  {/* Vehicle image */}
                  <div className="relative flex-shrink-0" style={{ width: 110 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getVehicleImage(slug, vtImages[slug])}
                      alt={VEHICLE_LABELS[slug]}
                      className="w-full h-full object-cover"
                      style={{ height: 110 }}
                    />
                    {isBest && (
                      <span className="absolute top-2 left-2 bg-lime text-ink text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                        BEST VALUE
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col p-3 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink text-sm">{VEHICLE_LABELS[slug]}</p>
                        {discount_label && (
                          <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">{discount_label}</span>
                        )}
                      </div>
                      {totalPrice > 0 ? (
                        <div className="text-right flex-shrink-0">
                          {original_price && !hasReturn && (
                            <p className="text-[10px] text-tx-light line-through">€{original_price}</p>
                          )}
                          {hasReturn ? (
                            <>
                              {returnPricing.display_mode !== 'total' && (
                                <p className="text-[10px] text-tx-light">
                                  {returnPricing.mode === 'discount' && returnPrice !== price
                                    ? `€${price} + €${returnPrice}`
                                    : `€${price} × 2`}
                                </p>
                              )}
                              {returnPricing.mode === 'discount' && returnPricing.discount_label && (
                                <span className="text-[9px] bg-lime/20 text-ink px-1.5 py-0.5 rounded-full font-semibold block mb-0.5">
                                  {returnPricing.discount_label}
                                </span>
                              )}
                              <p className={`text-base font-bold ${original_price ? 'text-red-500' : 'text-ink'}`}>€{totalPrice}</p>
                            </>
                          ) : (
                            <p className={`text-base font-bold ${original_price ? 'text-red-500' : 'text-ink'}`}>€{price}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-tx-light flex-shrink-0">Enquire</p>
                      )}
                    </div>
                    <p className="text-xs text-tx-light mt-0.5">
                      Up to {cap.pax} 👤 · {cap.luggage} 🧳
                    </p>
                    <p className="text-[11px] text-tx-light mt-0.5 truncate">{vtExamples[slug] ?? VEHICLE_EXAMPLES[slug]}</p>
                    {hasReturn && (
                      <p className="text-[10px] text-ink mt-0.5 font-medium">↩ Return included</p>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => handleSelect(slug)}
                      className="mt-2 self-end bg-lime text-ink text-xs font-semibold px-3 py-1.5 rounded-full"
                    >
                      Select →
                    </button>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Return trip bottom sheet */}
      {showReturnPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReturnPicker(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 w-full max-w-[480px] mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="font-display text-lg font-light text-ink mb-4">Return trip</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-tx-light mb-1">Return date</label>
                <input
                  type="date"
                  value={bannerRetDate}
                  min={date || new Date().toISOString().split('T')[0]}
                  onChange={e => setBannerRetDate(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-ink/40"
                />
              </div>
              <div>
                <label className="block text-xs text-tx-light mb-1">Return time</label>
                <select
                  value={bannerRetTime}
                  onChange={e => setBannerRetTime(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-ink/40"
                >
                  {slots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={applyReturnTrip}
                disabled={!bannerRetDate}
                className="w-full py-3 rounded-full bg-lime text-ink text-sm font-semibold disabled:opacity-40"
              >
                {hasReturn ? 'Update return trip' : 'Add return trip'}
              </button>
              {hasReturn && (
                <button
                  onClick={() => { removeReturnTrip(); setShowReturnPicker(false); }}
                  className="w-full py-2 text-sm text-red-500"
                >
                  Remove return trip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom summary */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border px-5 py-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>✓ Free cancellation up to 24h</span>
          <span>✓ Confirmed within 2 hours</span>
        </div>
        <div className="flex items-center justify-between text-xs text-tx-light">
          <span>✓ Flight delays? We adjust</span>
          {hasReturn ? (
            <span className="text-ink font-medium">↩ Return trip added</span>
          ) : (
            <span className="text-tx-light">✓ Professional drivers</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransferResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-tx-light text-sm">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
