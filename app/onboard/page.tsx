'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { setSession } from '@/lib/utils';
import { AccommodationCard, SelectionChip, Button } from '@/components/ui/components';
import { AccommodationInput } from '@/components/ui/accommodation-input';
import type { Tier, Region, GroupType } from '@/lib/types';

const COUNTRY_CODES = [
  { flag: '🇬🇷', code: '30',  label: '+30' },
  { flag: '🇬🇧', code: '44',  label: '+44' },
  { flag: '🇩🇪', code: '49',  label: '+49' },
  { flag: '🇫🇷', code: '33',  label: '+33' },
  { flag: '🇵🇱', code: '48',  label: '+48' },
  { flag: '🇺🇸', code: '1',   label: '+1'  },
  { flag: '🇮🇹', code: '39',  label: '+39' },
  { flag: '🇳🇱', code: '31',  label: '+31' },
  { flag: '🇸🇪', code: '46',  label: '+46' },
  { flag: '🇳🇴', code: '47',  label: '+47' },
  { flag: '🇩🇰', code: '45',  label: '+45' },
];

const GROUP_OPTIONS: { label: string; value: GroupType }[] = [
  { label: '👫 Couple', value: 'couple' },
  { label: '👨‍👩‍👧 Family', value: 'family' },
  { label: '👥 Friends', value: 'friends' },
  { label: '🧳 Solo', value: 'solo' },
];

const REGION_LABELS: Record<Region, string> = {
  chania: 'Chania, Crete 🇬🇷',
  rethymno: 'Rethymno, Crete 🇬🇷',
  heraklion: 'Heraklion, Crete 🇬🇷',
  lasithi: 'Lasithi, Crete 🇬🇷',
};

function OnboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugFromUrl    = searchParams.get('prop');
  const tierFromUrl    = searchParams.get('tier') as Tier | null;
  const regionFromUrl  = searchParams.get('region') as Region | null;

  const [isAdminPreview, setIsAdminPreview] = useState(false);

  // Property state (resolved from Supabase)
  const [propertySlug, setPropertySlug] = useState('');
  const [propertyUuid, setPropertyUuid] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [tier, setTier] = useState<Tier>(tierFromUrl ?? 'M');
  const [region, setRegion] = useState<Region>(regionFromUrl ?? 'chania');
  const [propertyLoading, setPropertyLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [groupType, setGroupType] = useState<GroupType | null>(null);
  const [waOptIn, setWaOptIn] = useState(true);
  const [countryCode, setCountryCode] = useState('30');
  const [localPhone, setLocalPhone] = useState('');
  const [adults, setAdults] = useState<string>('');
  const [children, setChildren] = useState<string>('');
  const [friendsCount, setFriendsCount] = useState<string>('');
  const [nameError, setNameError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [changeSheetOpen, setChangeSheetOpen] = useState(false);

  useEffect(() => {
    setIsAdminPreview(localStorage.getItem('ik_admin_preview') === '1');
  }, []);

  // ── Admin preview skip ────────────────────────────────────────────────────
  function handleAdminSkip() {
    const today = new Date().toISOString().slice(0, 10);
    const checkOut = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    setSession({
      guest_id: null,
      first_name: 'Admin Preview',
      property_id: 'dimitris-city-break',
      property_name: 'Dimitris City Break Apts',
      tier: 'P',
      region: 'chania',
      check_in: today,
      check_out: checkOut,
      group_type: 'couple',
      whatsapp_opted_in: false,
      whatsapp_number: null,
    });
    document.cookie = 'ik_access=1; path=/; max-age=7776000; SameSite=Lax';
    router.push('/home');
  }

  // Load property from URL param only — never from stale localStorage cache
  useEffect(() => {
    async function loadProperty() {
      if (!slugFromUrl) {
        // No QR param — leave accommodation blank for manual entry
        setPropertyLoading(false);
        return;
      }

      setPropertySlug(slugFromUrl);

      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, tier, region')
        .eq('slug', slugFromUrl)
        .single();

      type PropRow = { id: string; name: string; tier: Tier; region: Region };
      const prop = data as unknown as PropRow | null;
      if (!error && prop) {
        setPropertyUuid(prop.id);
        setPropertyName(prop.name);
        setTier(prop.tier);
        setRegion(prop.region);
      } else {
        // Fallback name if fetch fails
        setPropertyName(slugFromUrl);
      }
      setPropertyLoading(false);
    }

    loadProperty();
  }, [slugFromUrl]);

  function handleChangeProperty() {
    setChangeSheetOpen(true);
  }

  function handleAccommodationSelect(p: { display_name: string; formatted_address: string; place_id: string; lat: number; lng: number }) {
    setPropertyName(p.display_name);
    setChangeSheetOpen(false);
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!firstName.trim()) { setNameError(true); return; }
    setNameError(false);
    if (!checkIn || !checkOut) { setDateError(true); return; }
    setDateError(false);
    setSubmitting(true);

    let guestId: string | null = null;

    // Compute group_size
    let groupSize: number | null = null;
    if (groupType === 'couple') groupSize = 2;
    else if (groupType === 'solo') groupSize = 1;
    else if (groupType === 'family') groupSize = (parseInt(adults) || 0) + (parseInt(children) || 0) || null;
    else if (groupType === 'friends') groupSize = parseInt(friendsCount) || null;

    // Build full international number (digits only, no + sign)
    const whatsappNumber = waOptIn && localPhone.trim()
      ? `${countryCode}${localPhone.trim().replace(/^0+/, '').replace(/\D/g, '')}`
      : null;

    // Insert guest record via server-side API route (bypasses RLS, uses service role)
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName || 'Guest',
          property_id: propertyUuid,
          tier,
          region,
          check_in: checkIn,
          check_out: checkOut,
          group_type: groupType || 'couple',
          group_size: groupSize,
          adults: groupType === 'family' ? (parseInt(adults) || null) : null,
          children: groupType === 'family' ? (parseInt(children) || 0) : null,
          whatsapp_opted_in: waOptIn,
          whatsapp_number: whatsappNumber,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('Onboard: guest insert failed', json.error);
      } else {
        guestId = json.id ?? null;
      }
    } catch (err) {
      console.error('Onboard: guest insert error', err);
      // Continue anyway — session still works without guest_id
    }

    const session = {
      guest_id: guestId,
      first_name: firstName || 'Guest',
      property_id: propertySlug,   // slug — used for display and booking slug→UUID lookups
      property_name: propertyName,
      tier,
      region,
      check_in: checkIn,
      check_out: checkOut,
      group_type: groupType || 'couple',
      whatsapp_opted_in: waOptIn,
      whatsapp_number: whatsappNumber,
    };

    setSession(session);
    // Ensure the access cookie is present so middleware allows /home through
    document.cookie = 'ik_access=1; path=/; max-age=7776000; SameSite=Lax';
    localStorage.removeItem('ik_qr');

    if (waOptIn && whatsappNumber) {
      // Opted in with a number — show success message then navigate
      setShowSuccess(true);
      setTimeout(() => router.push('/home'), 2000);
    } else {
      // No WhatsApp — show gentle nudge before navigating
      setShowNudge(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Admin preview bar — full-width, top of page, in normal flow (no overlap issues) */}
      {isAdminPreview && (
        <button
          type="button"
          onClick={handleAdminSkip}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 border-b border-gray-200 px-4 py-2.5 text-[12px] text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <span className="text-[9px] font-bold bg-gray-300 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Admin</span>
          ⚙ Admin Preview — Skip onboarding →
        </button>
      )}

      <div className="flex-1 flex flex-col px-6 pt-[72px] pb-8">
        {/* Header */}
        <h1 className="font-display text-[26px] font-normal text-navy mb-1">Welcome to</h1>
        <p className="text-sm font-semibold text-teal mb-5">{REGION_LABELS[region]}</p>

        {/* Accommodation ID */}
        {propertyLoading ? (
          <div className="h-[64px] bg-gray-100 rounded-sm animate-pulse mb-4" />
        ) : (
          <>
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1">
              You're staying at
            </p>
            <AccommodationCard name={propertyName} onChangeProperty={handleChangeProperty} />
          </>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">
            Your first name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
            placeholder="e.g. Maria"
            className={`w-full px-3.5 py-3 border-[1.5px] rounded-sm font-body text-sm text-tx bg-white outline-none transition-colors focus:border-teal placeholder:text-tx-light ${nameError ? 'border-red-400' : 'border-border'}`}
          />
          {nameError && <p className="text-[11px] text-red-500 mt-1">Please enter your name</p>}
        </div>

        {/* Dates */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">
            When are you here?
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                const v = e.target.value;
                setCheckIn(v);
                if (v) setDateError(false);
                // Reset check-out if it's no longer after the new check-in
                if (checkOut && v && checkOut <= v) setCheckOut('');
              }}
              className={`flex-1 px-3.5 py-3 border-[1.5px] rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal ${dateError && !checkIn ? 'border-red-400' : 'border-border'}`}
            />
            <input
              type="date"
              value={checkOut}
              min={checkIn ? (() => { const d = new Date(checkIn + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })() : undefined}
              onChange={(e) => { setCheckOut(e.target.value); if (e.target.value) setDateError(false); }}
              className={`flex-1 px-3.5 py-3 border-[1.5px] rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal ${dateError && !checkOut ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {dateError && <p className="text-[11px] text-red-500 mt-1">Please enter your check-in and check-out dates</p>}
        </div>

        {/* Group type */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">
            Travelling with
          </label>
          <div className="flex gap-2 flex-wrap">
            {GROUP_OPTIONS.map((opt) => (
              <SelectionChip
                key={opt.value}
                label={opt.label}
                selected={groupType === opt.value}
                onClick={() => setGroupType(opt.value)}
              />
            ))}
          </div>

          {/* Family inputs */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              groupType === 'family' ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-tx-mid mb-1 block">Adults</label>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  placeholder="2"
                  inputMode="numeric"
                  className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-tx-mid mb-1 block">Children</label>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                  className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal"
                />
              </div>
            </div>
          </div>

          {/* Friends input */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              groupType === 'friends' ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div>
              <label className="text-[11px] text-tx-mid mb-1 block">How many in your group?</label>
              <input
                type="number"
                min={2}
                value={friendsCount}
                onChange={(e) => setFriendsCount(e.target.value)}
                placeholder="4"
                inputMode="numeric"
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp opt-in */}
        <div className="mt-1">
          <div className="flex items-center gap-3 p-3 bg-teal-light rounded-sm">
            <span className="text-base">💬</span>
            <p className="text-xs text-navy flex-1 leading-snug">
              Get local tips & deals on WhatsApp
            </p>
            <button
              onClick={() => setWaOptIn(!waOptIn)}
              className={`w-11 h-[26px] rounded-full relative transition-colors flex-shrink-0 ${
                waOptIn ? 'bg-teal' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  waOptIn ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Phone input — animates in when opt-in is ON */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              waOptIn ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[90px] px-2 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal flex-shrink-0"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="Your WhatsApp number"
                inputMode="tel"
                className="flex-1 px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none transition-colors focus:border-teal placeholder:text-tx-light"
              />
            </div>
          </div>
        </div>
      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        className="mt-5 flex-shrink-0"
        disabled={submitting}
      >
        {submitting ? 'Saving...' : "Let's go →"}
      </Button>
    </div>{/* end padded content area */}

      {/* Accommodation change bottom sheet */}
      {changeSheetOpen && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/40" onClick={() => setChangeSheetOpen(false)}>
          <div
            className="bg-white rounded-t-2xl px-6 pt-6 pb-10 w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-5" />
            <h2 className="font-display text-[18px] font-medium text-navy mb-1">Change accommodation</h2>
            <p className="text-[12px] text-tx-light mb-4">Search for your villa, hotel or apartment.</p>
            <AccommodationInput
              initialValue={propertyName}
              onSelect={handleAccommodationSelect}
            />
            <button
              onClick={() => setChangeSheetOpen(false)}
              className="mt-5 w-full py-3 text-[13px] text-tx-mid"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp success message */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl px-6 py-7 max-w-sm w-full text-center shadow-xl">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-[15px] text-navy leading-relaxed">
              You're all set! We'll send you curated tips, last-minute deals and local news on WhatsApp during your stay in Crete.
            </p>
          </div>
        </div>
      )}

      {/* WhatsApp nudge modal */}
      {showNudge && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/40">
          <div className="bg-white rounded-t-2xl px-6 pt-6 pb-10 w-full shadow-xl animate-slide-up">
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-5" />
            <h2 className="font-display text-[20px] font-medium text-navy mb-2">Don't miss out</h2>
            <p className="text-[13px] text-tx-mid leading-relaxed mb-6">
              Our WhatsApp updates are how guests discover the best last-minute deals, hidden gems and local events during their stay. It's free, easy to unsubscribe, and we'll never spam you.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setShowNudge(false)}
                className="w-full py-3.5 rounded-lg bg-teal text-white text-[14px] font-semibold"
              >
                Stay in the loop
              </button>
              <button
                onClick={() => router.push('/home')}
                className="w-full py-3 text-[13px] text-tx-mid"
              >
                No thanks, continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <OnboardContent />
    </Suspense>
  )
}
