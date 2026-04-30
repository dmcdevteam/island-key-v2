'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VEHICLE_LABELS, VEHICLE_CAPACITY, formatTransferDate, generateTimeSlots, type VehicleSlug } from '@/lib/transfers';
import { getSession, whatsappLink } from '@/lib/utils';

const EXTRAS = [
  { key: 'child_seat',    label: 'Child seat',            note: 'For children under 36 kg' },
  { key: 'name_board',    label: 'Name board',            note: 'Driver meets you in arrivals' },
  { key: 'welcome_pack',  label: 'Welcome pack',          note: 'Water, snacks, welcome note' },
  { key: 'extra_luggage', label: 'Extra luggage space',   note: 'Let us know if you have oversized bags' },
];

function BookingContent() {
  const router = useRouter();
  const sp     = useSearchParams();
  const session = getSession();

  const fromName  = sp.get('from_name') ?? '';
  const fromAddr  = sp.get('from_addr') ?? '';
  const fromLat   = sp.get('from_lat')  ?? '';
  const fromLng   = sp.get('from_lng')  ?? '';
  const toName    = sp.get('to_name')   ?? '';
  const toAddr    = sp.get('to_addr')   ?? '';
  const toLat     = sp.get('to_lat')    ?? '';
  const toLng     = sp.get('to_lng')    ?? '';
  const date      = sp.get('date')      ?? '';
  const time      = sp.get('time')      ?? '';
  const pax       = sp.get('pax')       ?? '1';
  const luggage   = sp.get('luggage')   ?? '1';
  const km        = sp.get('km')        ?? '0';
  const dur       = sp.get('dur')       ?? '0';
  const isAirport = sp.get('airport')   === '1';
  const vehicle   = (sp.get('vehicle')  ?? 'sedan') as VehicleSlug;
  const price     = parseInt(sp.get('price') ?? '0');
  const retDate   = sp.get('ret_date')  ?? '';
  const retTime   = sp.get('ret_time')  ?? '';
  const hasReturn = !!retDate;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const staticMapUrl = apiKey && fromLat && toLat
    ? `https://maps.googleapis.com/maps/api/staticmap?size=600x192&markers=color:0x1A8A7D%7C${fromLat},${fromLng}&markers=color:0x1B2D4F%7C${toLat},${toLng}&style=feature:poi%7Celement:labels%7Cvisibility:off&style=feature:transit%7Celement:all%7Cvisibility:off&key=${apiKey}`
    : null;

  const [forSelf, setForSelf] = useState(true);
  const [guestName,  setGuestName]  = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [whatsappOpt, setWhatsappOpt] = useState(true);
  const [flightNumber, setFlightNumber] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [confCode, setConfCode]     = useState('');
  const [retCode,  setRetCode]      = useState('');

  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [pickerRetDate, setPickerRetDate] = useState('');
  const [pickerRetTime, setPickerRetTime] = useState('10:00');
  const slots = generateTimeSlots();

  useEffect(() => {
    const s = getSession();
    if (s?.first_name)      setGuestName(s.first_name);
    if (s?.whatsapp_number) setGuestPhone(s.whatsapp_number);
  }, []);

  function toggleExtra(key: string) {
    setExtras(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
  }

  function applyReturnTrip() {
    if (!pickerRetDate) return;
    const newParams = new URLSearchParams(sp.toString());
    newParams.set('ret_date', pickerRetDate);
    newParams.set('ret_time', pickerRetTime);
    router.replace(`/transfers/booking?${newParams.toString()}`);
    setShowReturnPicker(false);
  }

  function removeReturnTrip() {
    const newParams = new URLSearchParams(sp.toString());
    newParams.delete('ret_date');
    newParams.delete('ret_time');
    router.replace(`/transfers/booking?${newParams.toString()}`);
  }

  function buildWhatsAppMessage(code: string, returnCode?: string): string {
    const lines = [
      hasReturn ? `[ISLAND KEY TRANSFER — RETURN TRIP]` : `[ISLAND KEY TRANSFER]`,
      `Guest: ${guestName}`,
      ``,
      hasReturn ? `--- OUTBOUND ---` : null,
      `Pickup: ${time}, ${formatTransferDate(date)}`,
      `From: ${fromName}`,
      `To: ${toName}`,
      `Vehicle: ${VEHICLE_LABELS[vehicle]}`,
      `Pax: ${pax} · Luggage: ${luggage}`,
      `Flight: ${flightNumber || 'N/A'}`,
      `Extras: ${extras.length > 0 ? extras.join(', ') : 'None'}`,
      `Distance: ~${km} km`,
      `Notes: ${notes || 'None'}`,
      `Reference: ${code}`,
    ].filter((l): l is string => l !== null);

    if (hasReturn && returnCode) {
      lines.push(
        ``,
        `--- RETURN ---`,
        `Pickup: ${retTime}, ${formatTransferDate(retDate)}`,
        `From: ${toName}`,
        `To: ${fromName}`,
        `Reference: ${returnCode}`,
      );
    }

    lines.push(``, `Reply ACCEPT to confirm${hasReturn ? ' both legs' : ''} or DECLINE.`);
    return lines.join('\n');
  }

  async function handleSubmit() {
    if (!guestName.trim() || submitting) return;
    setSubmitting(true);

    let code    = '';
    let retCodeVal = '';
    try {
      const pickupAt  = date && time ? `${date}T${time}:00` : null;
      const groupRef  = hasReturn ? `GRP-${Date.now()}` : null;

      const basePayload = {
        item_type:         'transfer',
        item_id:           null,
        pax:               parseInt(pax),
        unit_price:        price,
        total_price:       price,
        payment_method:    'whatsapp',
        guest_id:          session?.guest_id ?? null,
        property_slug:     session?.property_id ?? null,
        guest_name:        guestName  || null,
        guest_email:       guestEmail || null,
        guest_notes:       notes      || null,
        notes:             notes      || null,
        transfer_type:     isAirport ? 'arrival' : 'point_to_point',
        pax_count:         parseInt(pax),
        luggage_count:     parseInt(luggage),
        vehicle_class:     vehicle,
        distance_km:       parseFloat(km) || null,
        duration_min:      parseInt(dur)  || null,
        extras,
        group_ref:         groupRef,
      };

      // Outbound booking
      const res1 = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          item_title:       `Transfer: ${fromName} → ${toName}`,
          booking_date:     date,
          booking_time:     time,
          pickup_at:        pickupAt,
          pickup_location:  fromName,
          dropoff_location: toName,
          flight_number:    flightNumber || null,
        }),
      });
      if (res1.ok) {
        const data = await res1.json();
        code = data.confirmation_code ?? '';
        setConfCode(code);
      }

      // Return booking
      if (hasReturn) {
        const retPickupAt = retDate && retTime ? `${retDate}T${retTime}:00` : null;
        const res2 = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            item_title:       `Transfer: ${toName} → ${fromName}`,
            booking_date:     retDate,
            booking_time:     retTime,
            pickup_at:        retPickupAt,
            pickup_location:  toName,
            dropoff_location: fromName,
            flight_number:    null,
          }),
        });
        if (res2.ok) {
          const data = await res2.json();
          retCodeVal = data.confirmation_code ?? '';
          setRetCode(retCodeVal);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }

    window.open(whatsappLink(buildWhatsAppMessage(code, retCodeVal)), '_blank');
    setConfirmed(true);
  }

  const totalPrice = hasReturn ? price * 2 : price;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 text-center space-y-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
        <div>
          <h2 className="text-xl font-semibold text-navy">
            {hasReturn ? 'Return trip requested!' : 'Transfer requested!'}
          </h2>
          <p className="text-sm text-tx-light mt-1 max-w-xs mx-auto">
            We'll confirm your driver{hasReturn ? 's' : ''} within 2 hours. Check WhatsApp for updates.
          </p>
        </div>
        {confCode && (
          <div className="bg-white rounded-xl border border-border-light px-6 py-3 w-full">
            <p className="text-xs text-tx-light mb-1">Reference{retCode ? 's' : ''}</p>
            <p className="font-mono font-bold text-navy text-lg">{confCode}</p>
            {retCode && (
              <p className="font-mono font-bold text-navy text-lg mt-1">
                {retCode} <span className="text-xs font-normal text-tx-light">(return)</span>
              </p>
            )}
          </div>
        )}
        <div className="w-full space-y-2">
          <a
            href={whatsappLink(buildWhatsAppMessage(confCode, retCode))}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm text-center"
          >
            Open WhatsApp chat
          </a>
          <button onClick={() => router.push('/')} className="text-sm text-tx-light underline">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-tx-mid">← Back</button>
        <h1 className="font-display text-lg font-medium text-navy">Your details</h1>
      </div>

      {/* Order summary */}
      <div className="mx-5 mb-5 bg-white rounded-2xl border border-border-light p-4 space-y-2">
        {/* Route map thumbnail */}
        {staticMapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={staticMapUrl} alt="" className="w-full h-24 rounded-xl object-cover mb-3" />
        ) : (
          <div
            className="w-full h-24 rounded-xl bg-navy/10 flex items-center justify-center mb-3 overflow-hidden"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1555993539-1732b0258235?w=600)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        <Row label="Route">{fromName} → {toName}</Row>
        {hasReturn && (
          <Row label="Return">
            <span className="text-teal font-medium">↩ {toName} → {fromName}</span>
          </Row>
        )}
        <Row label="Outbound">{formatTransferDate(date)} · {time}</Row>
        {hasReturn && <Row label="Return">{formatTransferDate(retDate)} · {retTime}</Row>}
        <Row label="Vehicle">{VEHICLE_LABELS[vehicle]}</Row>
        <Row label="Passengers">{pax} pax · {luggage} bags</Row>
        <div className="border-t border-border-light pt-2 flex items-center justify-between">
          <span className="text-sm text-tx-light">Total (taxes included)</span>
          {price > 0 ? (
            hasReturn ? (
              <div className="text-right">
                <p className="text-xs text-tx-light">€{price} outbound + €{price} return</p>
                <span className="text-xl font-bold text-teal">€{totalPrice}</span>
              </div>
            ) : (
              <span className="text-xl font-bold text-teal">€{price}</span>
            )
          ) : (
            <span className="text-sm text-tx-light italic">Price on enquiry</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['✓ Free cancellation', '✓ Meet & Greet', '✓ Door-to-door', '✓ Licensed drivers'].map(b => (
            <span key={b} className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">{b}</span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="px-5 space-y-4">
        {/* Flight number */}
        <div>
          <label className="block text-xs text-tx-light mb-1">Flight number (optional)</label>
          <input
            value={flightNumber}
            onChange={e => setFlightNumber(e.target.value)}
            placeholder="e.g. FR1234 — helps us track delays"
            className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
          />
        </div>

        {/* Who */}
        <div>
          <p className="text-xs text-tx-light mb-2">Who is this transfer for?</p>
          <div className="space-y-2">
            {[
              { val: true,  label: "I'm the main passenger" },
              { val: false, label: 'Booking for someone else' },
            ].map(opt => (
              <label key={String(opt.val)} className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${forSelf === opt.val ? 'border-navy' : 'border-gray-300'}`}>
                  {forSelf === opt.val && <div className="w-2 h-2 rounded-full bg-navy" />}
                </div>
                <span className="text-sm text-navy" onClick={() => setForSelf(opt.val)}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-tx-light mb-1">Full name *</label>
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
            />
          </div>
          <div>
            <label className="block text-xs text-tx-light mb-1">Email</label>
            <input
              type="email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
            />
          </div>
          <div>
            <label className="block text-xs text-tx-light mb-1">Phone</label>
            <input
              type="tel"
              value={guestPhone}
              onChange={e => setGuestPhone(e.target.value)}
              placeholder="+30 6900 000 000"
              className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setWhatsappOpt(v => !v)}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${whatsappOpt ? 'bg-teal border-teal' : 'border-gray-300'}`}
            >
              {whatsappOpt && <span className="text-white text-[10px] leading-none">✓</span>}
            </div>
            <span className="text-sm text-tx-mid">Send booking updates via WhatsApp</span>
          </label>
        </div>

        {/* Extras */}
        <div>
          <p className="text-xs text-tx-light mb-2 font-medium">Extras — all complimentary</p>
          <div className="space-y-2">
            {EXTRAS.map(ex => {
              const active = extras.includes(ex.key);
              return (
                <button
                  key={ex.key}
                  onClick={() => toggleExtra(ex.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${active ? 'border-teal bg-teal/5' : 'border-border-light bg-white'}`}
                >
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-teal' : 'text-navy'}`}>{ex.label}</p>
                    <p className="text-xs text-tx-light">{ex.note}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ml-2 ${active ? 'bg-teal border-teal' : 'border-gray-200'}`}>
                    {active && <span className="text-white text-[10px] leading-none">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Return trip row */}
        <button
          onClick={() => { setPickerRetDate(retDate || ''); setPickerRetTime(retTime || '10:00'); setShowReturnPicker(true); }}
          style={{
            width: '100%', borderRadius: 10,
            background: '#FDFCFA', border: '1.5px solid #1A8A7D',
            display: 'flex', alignItems: 'flex-start',
            padding: '10px 12px', gap: 8,
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ color: '#1A8A7D', fontSize: 16, flexShrink: 0, marginTop: 1 }}>↔</span>
          <span style={{ flex: 1 }}>
            {hasReturn ? (
              <span style={{ fontSize: 13, color: '#1B2D4F', fontWeight: 600 }}>
                Return: {formatTransferDate(retDate)} at {retTime}
              </span>
            ) : (
              <>
                <span style={{ display: 'block', fontSize: 13, color: '#1B2D4F', fontWeight: 600 }}>Add a return trip?</span>
                <span style={{ display: 'block', fontSize: 11, color: '#9E9E9E', marginTop: 2 }}>Same vehicle, same price.</span>
              </>
            )}
          </span>
          <span style={{ color: '#1A8A7D', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            {hasReturn ? 'edit' : '+'}
          </span>
        </button>

        {/* Notes */}
        <div>
          <label className="block text-xs text-tx-light mb-1">Notes for driver (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything useful for the driver…"
            rows={3}
            className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40 resize-none"
          />
        </div>

        {/* Cancellation policy */}
        <p className="text-xs text-tx-light">
          Free cancellation up to 24h before pickup.
          Cancellations within 24h are non-refundable.
        </p>
      </div>

      {/* Return trip bottom sheet */}
      {showReturnPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReturnPicker(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 w-full max-w-[480px] mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="font-display text-lg text-navy mb-4">Return trip</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-tx-light mb-1">Return date</label>
                <input
                  type="date"
                  value={pickerRetDate}
                  min={date || new Date().toISOString().split('T')[0]}
                  onChange={e => setPickerRetDate(e.target.value)}
                  className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
                />
              </div>
              <div>
                <label className="block text-xs text-tx-light mb-1">Return time</label>
                <select
                  value={pickerRetTime}
                  onChange={e => setPickerRetTime(e.target.value)}
                  className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40"
                >
                  {slots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={applyReturnTrip}
                disabled={!pickerRetDate}
                className="w-full py-3 rounded-xl bg-teal text-white text-sm font-semibold disabled:opacity-40"
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

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border-light px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-tx-light">Total incl. taxes &amp; fees{hasReturn ? ' · both legs' : ''}</span>
          {price > 0 ? (
            hasReturn ? (
              <div className="text-right">
                <p className="text-[10px] text-tx-light">€{price} × 2</p>
                <span className="text-xl font-bold text-teal">€{totalPrice}</span>
              </div>
            ) : (
              <span className="text-xl font-bold text-teal">€{price}</span>
            )
          ) : (
            <span className="text-sm text-tx-light italic">Price on enquiry</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!guestName.trim() || submitting}
          className="w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-40"
        >
          {submitting ? 'Processing…' : hasReturn ? 'Confirm both transfer requests →' : 'Confirm transfer request →'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-tx-light flex-shrink-0 w-20">{label}</span>
      <span className="text-sm text-navy text-right">{children}</span>
    </div>
  );
}

export default function TransferBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center text-tx-light text-sm">Loading…</div>}>
      <BookingContent />
    </Suspense>
  );
}
