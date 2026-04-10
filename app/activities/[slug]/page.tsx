'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookButton, WhatsAppButton } from '@/components/ui/components';
import { whatsappLink, formatPrice, getSession } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Activity } from '@/lib/types';

const CATEGORY_GRADIENTS: Record<string, string> = {
  sea:       'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(27,45,79,0.1))',
  land:      'linear-gradient(135deg,rgba(27,45,79,0.15),rgba(26,138,125,0.1))',
  table:     'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(212,133,74,0.1))',
  culture:   'linear-gradient(135deg,rgba(122,107,93,0.15),rgba(196,112,63,0.1))',
  adventure: 'linear-gradient(135deg,rgba(139,111,71,0.15),rgba(107,123,94,0.1))',
  wellness:  'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(232,245,243,0.1))',
};
const CATEGORY_ICONS: Record<string, string> = {
  sea: '🌊', land: '⛰️', table: '🍷', culture: '🏛️', adventure: '🧗', wellness: '🧘',
};

const COUNTRY_CODES = [
  { flag: '🇬🇷', code: '+30',  label: 'GR' },
  { flag: '🇬🇧', code: '+44',  label: 'GB' },
  { flag: '🇩🇪', code: '+49',  label: 'DE' },
  { flag: '🇫🇷', code: '+33',  label: 'FR' },
  { flag: '🇵🇱', code: '+48',  label: 'PL' },
  { flag: '🇺🇸', code: '+1',   label: 'US' },
  { flag: '🇮🇹', code: '+39',  label: 'IT' },
  { flag: '🇳🇱', code: '+31',  label: 'NL' },
  { flag: '🇸🇪', code: '+46',  label: 'SE' },
  { flag: '🇳🇴', code: '+47',  label: 'NO' },
  { flag: '🇩🇰', code: '+45',  label: 'DK' },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [session, setSession] = useState<import('@/lib/types').GuestSession | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(tomorrow());
  const [pax, setPax] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+30');
  const [localPhone, setLocalPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);

  // Read session client-side only (localStorage unavailable during SSR)
  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s?.first_name) setGuestName(s.first_name);
    // Initialise booking date to check_in so value is never before min
    if (s?.check_in) setBookingDate(s.check_in);
  }, []);

  // Debug: log session when modal opens so we can verify check_in/check_out
  useEffect(() => {
    if (showModal) console.log('[BOOKING DEBUG] session:', session);
  }, [showModal, session]);

  useEffect(() => {
    if (!slug) return;
    createClient()
      .from('activities')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setActivity(data);
        setLoading(false);
      });
  }, [slug]);

  const unitPrice = activity?.price_from ?? 0;
  const total = unitPrice * pax;
  const maxPax = activity?.max_group_size ?? 20;
  const hasPrice = unitPrice > 0;

  function validateEmail() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
    setEmailError(!valid);
    return valid;
  }

  // ─── WhatsApp path ───
  async function handleWhatsApp() {
    if (!activity) return;
    if (!validateEmail()) return;
    setBookingLoading(true);
    setBookingError(null);

    let confirmationCode: string | null = null;

    try {
      const supabase = createClient();

      // session.property_id is a slug — look up the UUID before inserting
      let propertyUuid: string | null = null;
      if (session?.property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('id')
          .eq('slug', session.property_id)
          .single();
        propertyUuid = prop?.id ?? null;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          item_type: 'activity',
          item_id: activity.id,
          item_title: activity.title,
          booking_date: bookingDate,
          pax,
          days: 1,
          unit_price: unitPrice,
          total_price: total,
          payment_method: 'whatsapp',
          status: 'pending',
          guest_id: session?.guest_id ?? null,
          property_id: propertyUuid,
          provider_id: activity.provider_id ?? null,
        })
        .select('id, confirmation_code')
        .single();

      if (error) {
        console.error('Booking insert error:', error.message);
      } else if (data) {
        confirmationCode = data.confirmation_code;
        const resolvedName = guestName.trim() || session?.first_name || 'Guest';
        // Notify host — fire and forget
        fetch('/api/notify-host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.id,
            guestName: resolvedName,
            guestPhone: localPhone.trim()
              ? `${countryCode}${localPhone.trim().replace(/^0+/, '').replace(/\s+/g, '')}`
              : session?.whatsapp_number ?? null,
          }),
        }).catch(err => console.error('notify-host fetch error:', err));
        // Notify guest — fire and forget, skipped silently if no email
        if (guestEmail.trim()) {
          fetch('/api/notify-guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: data.id, guestEmail: guestEmail.trim(), guestName: resolvedName }),
          }).catch(err => console.error('notify-guest fetch error:', err));
        }
      }
    } catch (err) {
      console.error('Booking insert exception:', err);
    }

    const name = guestName.trim() || session?.first_name || 'Guest';
    const property = session?.property_name || 'my accommodation';

    // Build full international number from country code + local digits (strip leading zero)
    const fullPhone = localPhone.trim()
      ? `${countryCode}${localPhone.trim().replace(/^0+/, '').replace(/\s+/g, '')}`
      : session?.whatsapp_number ?? null;

    const parts = [
      `Hi Island Key! I'd like to book:`,
      activity.title,
      formatDateLong(bookingDate),
      `${pax} ${pax === 1 ? 'person' : 'people'}`,
      `Staying at: ${property}`,
      `Name: ${name}`,
      fullPhone ? `WhatsApp: ${fullPhone}` : null,
      confirmationCode ? `Ref: ${confirmationCode}` : null,
      `Please confirm availability.`,
    ].filter(Boolean);
    const message = parts.join(' | ');

    window.open(whatsappLink(message), '_blank');

    const params = new URLSearchParams({
      method: 'whatsapp',
      title: activity.title,
      date: bookingDate,
      pax: String(pax),
      total: String(total),
      ...(confirmationCode ? { code: confirmationCode } : {}),
      ...(activity.meeting_point ? { meeting: activity.meeting_point } : {}),
    });
    router.push(`/booking/confirmation?${params.toString()}`);
  }

  // ─── Stripe path ───
  async function handleStripeBook() {
    if (!activity || !hasPrice) return;
    if (!validateEmail()) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          activityTitle: activity.title,
          unitPrice,
          pax,
          bookingDate,
          guestId: session?.guest_id ?? null,
          propertyId: session?.property_id ?? null,
          providerId: activity.provider_id ?? null,
          meetingPoint: activity.meeting_point ?? null,
          guestEmail: guestEmail.trim() || null,
          guestName: guestName.trim() || session?.first_name || 'Guest',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Checkout failed');
      window.location.href = json.url;
    } catch (err: any) {
      setBookingError(err.message ?? 'Something went wrong. Try WhatsApp instead.');
      setBookingLoading(false);
    }
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="h-[210px] bg-navy/5 animate-pulse flex-shrink-0" />
        <div className="px-5 pt-4 space-y-3">
          <div className="h-6 bg-navy/5 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-navy/5 rounded animate-pulse w-1/2" />
          <div className="h-24 bg-navy/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── 404 ───
  if (notFound || !activity) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-4">🌊</p>
        <h1 className="font-display text-xl text-navy mb-2">Activity not found</h1>
        <p className="text-sm text-tx-light mb-6">This experience may no longer be available.</p>
        <button onClick={() => router.back()} className="text-sm font-semibold text-teal">← Back to activities</button>
      </div>
    );
  }

  const heroBg = CATEGORY_GRADIENTS[activity.category] ?? CATEGORY_GRADIENTS.culture;
  const categoryIcon = CATEGORY_ICONS[activity.category] ?? '🌟';

  return (
    <div className="min-h-screen bg-cream flex flex-col relative">
      {/* Hero */}
      <div className="h-[210px] relative flex items-end p-4 flex-shrink-0" style={{ background: heroBg }}>
        <button
          onClick={() => router.back()}
          className="absolute top-[52px] left-4 w-[34px] h-[34px] bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-base z-10 active:scale-90"
        >←</button>
        <span className="text-[10px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded uppercase">
          {categoryIcon} {activity.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[100px]">
        <h1 className="font-display text-[21px] font-medium text-navy mb-0.5">{activity.title}</h1>
        <p className="text-xs text-tx-light mb-3">{activity.meeting_point ?? activity.region}</p>

        <div className="flex flex-wrap gap-3 mb-3">
          {activity.duration && <span className="text-[11px] text-tx-mid">⏱ {activity.duration}</span>}
          {activity.max_group_size && <span className="text-[11px] text-tx-mid">👥 Max {activity.max_group_size}</span>}
          {activity.season && <span className="text-[11px] text-tx-mid">📅 {activity.season}</span>}
          {activity.languages?.length > 0 && <span className="text-[11px] text-tx-mid">🌐 {activity.languages.join(', ')}</span>}
        </div>

        {activity.availability_text && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-teal/10 rounded-lg">
            <span className="text-teal text-[13px]">🕐</span>
            <div>
              <span className="text-[10px] font-bold text-teal uppercase tracking-wide">Availability · </span>
              <span className="text-[13px] font-medium text-navy">{activity.availability_text}</span>
            </div>
          </div>
        )}

        <p className="text-[13px] text-tx-mid leading-relaxed mb-4">{activity.description}</p>

        {activity.includes && activity.includes.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">What's included</h3>
            <ul className="mb-4">
              {activity.includes.map(item => (
                <li key={item} className="text-xs text-tx-mid py-1.5 border-b border-border-light flex items-center gap-2">
                  <span className="text-teal font-bold text-[11px]">✓</span>{item}
                </li>
              ))}
            </ul>
          </>
        )}

        {activity.good_to_know && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">Good to know</h3>
            <p className="text-[13px] text-tx-mid leading-relaxed mb-4">{activity.good_to_know}</p>
          </>
        )}

        {activity.cancellation_policy && (
          <p className="text-[11px] text-tx-light italic">{activity.cancellation_policy}</p>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pt-2.5 pb-8 bg-white border-t border-border-light flex items-center gap-2.5">
        <div className="flex-shrink-0">
          <p className="text-[10px] text-tx-light">From</p>
          <p className="text-[19px] font-bold text-navy">
            {hasPrice ? <>{formatPrice(unitPrice)}<span className="text-[11px] text-tx-light font-normal">/pp</span></> : '—'}
          </p>
        </div>
        <BookButton onClick={() => { console.log('[IK] Modal open — session check_in:', session?.check_in, 'check_out:', session?.check_out); setShowModal(true); setBookingError(null); }} />
        <WhatsAppButton onClick={() => { console.log('[IK] Modal open — session check_in:', session?.check_in, 'check_out:', session?.check_out); setShowModal(true); setBookingError(null); }} />
      </div>

      {/* ─── Booking Modal ─── */}
      {showModal && (
        <div
          className="absolute inset-0 bg-black/35 z-[150] flex items-end"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full bg-white rounded-t-[18px] px-5 pt-5 pb-9 animate-slide-up max-h-[85%] overflow-y-auto">
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-lg font-medium text-navy mb-4">Book this experience</h2>

            {/* Activity summary */}
            <div className="flex justify-between items-start py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Experience</span>
              <span className="text-[13px] font-semibold text-navy text-right max-w-[55%]">{activity.title}</span>
            </div>

            {/* Date picker */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Date</span>
              <input
                type="date"
                value={bookingDate}
                min={session?.check_in ?? new Date().toISOString().slice(0, 10)}
                max={session?.check_out ?? undefined}
                onChange={e => {
                  let v = e.target.value;
                  const minDate = session?.check_in ?? new Date().toISOString().slice(0, 10);
                  const maxDate = session?.check_out;
                  if (v < minDate) v = minDate;
                  if (maxDate && v > maxDate) v = maxDate;
                  setBookingDate(v);
                }}
                className="text-[13px] font-semibold text-navy bg-transparent outline-none"
              />
            </div>

            {/* Pax counter */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Guests</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm active:bg-sand">−</button>
                <span className="text-[13px] font-semibold text-navy w-4 text-center">{pax}</span>
                <button onClick={() => setPax(Math.min(maxPax, pax + 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm active:bg-sand">+</button>
              </div>
            </div>

            {/* Guest name (if not in session) */}
            {!session?.first_name && (
              <div className="flex justify-between items-center py-2.5 border-b border-border-light">
                <span className="text-[13px] text-tx-mid">Your name</span>
                <input
                  type="text"
                  placeholder="First name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-36"
                />
              </div>
            )}

            {/* WhatsApp number (if not in session) */}
            {!session?.whatsapp_number && (
              <div className="flex justify-between items-center py-2.5 border-b border-border-light gap-2">
                <span className="text-[13px] text-tx-mid flex-shrink-0">WhatsApp</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="text-[12px] font-semibold text-navy bg-sand border border-border-light rounded px-1.5 py-1 outline-none"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="6900000000"
                    value={localPhone}
                    onChange={e => setLocalPhone(e.target.value)}
                    className="text-[13px] text-navy bg-transparent outline-none placeholder:text-tx-light w-28"
                  />
                </div>
              </div>
            )}

            {/* Email (required) */}
            <div className={`py-2.5 border-b ${emailError ? 'border-red-300' : 'border-border-light'}`}>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-tx-mid">Email</span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={guestEmail}
                  onChange={e => { setGuestEmail(e.target.value); if (emailError) setEmailError(false); }}
                  className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-48"
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-red-500 mt-1 text-right">Please enter your email address to receive booking confirmation</p>
              )}
            </div>

            {/* Accommodation */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Accommodation</span>
              <span className="text-[13px] font-semibold text-navy">{session?.property_name || '—'}</span>
            </div>

            {/* Total */}
            {hasPrice && (
              <div className="flex justify-between items-center py-3 border-b border-border-light">
                <span className="text-[15px] font-semibold text-navy">Total</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-navy">{formatPrice(total)}</span>
                  <span className="text-[11px] text-tx-light ml-1">({pax} × {formatPrice(unitPrice)})</span>
                </div>
              </div>
            )}

            {bookingError && (
              <p className="mt-3 text-[12px] text-red-600 text-center">{bookingError}</p>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              {hasPrice && (
                <button
                  onClick={handleStripeBook}
                  disabled={bookingLoading}
                  className="w-full py-3.5 bg-navy text-white rounded-sm font-semibold text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {bookingLoading ? 'Redirecting…' : <>Pay with card <span className="text-[10px] font-bold text-terra bg-terra-light px-1.5 py-0.5 rounded ml-1.5">TEST MODE</span></>}
                </button>
              )}
              <button
                onClick={handleWhatsApp}
                disabled={bookingLoading}
                className="w-full py-3.5 bg-whatsapp text-white rounded-sm font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                💬 Book via WhatsApp
              </button>
            </div>

            <p className="text-center text-[10px] text-tx-light mt-3">
              {activity.cancellation_policy ?? 'Free cancellation up to 24 hours before'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
