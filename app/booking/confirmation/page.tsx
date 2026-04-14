'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/components';
import { whatsappLink, getSession } from '@/lib/utils';

function formatDateLong(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function ConfirmationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const session = getSession();

  const code  = params.get('code');
  const title = params.get('title') ?? 'Your enquiry';
  const date  = params.get('date') ?? '';
  const pax   = params.get('pax') ?? '—';

  function handleWhatsApp() {
    const msg = [
      `Hi Island Key! I have a question about my enquiry.`,
      code ? `🔖 Ref: ${code}` : null,
      `📍 ${title}`,
      `📅 ${formatDateLong(date)}`,
    ].filter(Boolean).join('\n');
    window.open(whatsappLink(msg), '_blank');
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-14 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center text-3xl mb-5">
        ✓
      </div>

      <h1 className="font-display text-[22px] font-medium text-navy mb-1.5">
        Enquiry sent!
      </h1>
      <p className="text-[13px] text-tx-mid leading-relaxed mb-7 max-w-[300px]">
        Your Island Key curator will check availability and get back to you on WhatsApp within a few hours. We'll confirm everything before any payment is taken.
      </p>

      {/* Enquiry details */}
      <div className="w-full bg-sand rounded p-3.5 text-left mb-5">
        {[
          ['Experience', title],
          ['Date', formatDateLong(date)],
          ['Guests', pax],
          ...(code ? [['Enquiry ref', code]] : [['Reference', 'Check WhatsApp']]),
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5 border-b border-border-light last:border-b-0 text-[11px]">
            <span className="text-tx-light">{label}</span>
            <span className={`font-semibold text-right max-w-[60%] ${label === 'Enquiry ref' ? 'text-teal' : 'text-navy'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="w-full bg-white border border-border-light rounded p-3.5 text-left mb-5">
        <p className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">What happens next</p>
        <ul className="space-y-1.5 text-[12px] text-tx-mid">
          <li>1. Your curator checks availability</li>
          <li>2. You'll receive a WhatsApp message within a few hours</li>
          <li>3. Payment details are sent only after confirmation</li>
        </ul>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/home')} className="mb-2.5">
        Back to Home
      </Button>
      <button
        onClick={handleWhatsApp}
        className="w-full py-3.5 bg-whatsapp text-white rounded-sm font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        💬 Message your curator
      </button>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-tx-light text-sm">Loading…</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
