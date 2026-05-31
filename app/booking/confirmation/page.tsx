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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-14 text-center">
      {/* Success icon — lime circle with SVG check */}
      <div className="w-[72px] h-[72px] bg-lime rounded-full flex items-center justify-center mb-5 shadow-lime">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 className="font-display text-[30px] font-light text-ink mb-2">
        Enquiry sent!
      </h1>
      <p className="text-[13px] text-tx-mid leading-relaxed mb-8 max-w-[300px]">
        Your Island Key curator will check availability and get back to you on WhatsApp within a few hours. No payment until confirmed.
      </p>

      {/* Enquiry details */}
      <div className="w-full bg-mist rounded-2xl p-4 text-left mb-4">
        {[
          ['Experience', title],
          ['Date', formatDateLong(date)],
          ['Guests', pax],
          ...(code ? [['Enquiry ref', code]] : [['Reference', 'Check WhatsApp']]),
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 border-b border-border last:border-b-0 text-[12px]">
            <span className="text-tx-light">{label}</span>
            <span className="font-semibold text-ink text-right max-w-[60%]">{value}</span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="w-full bg-white border border-border rounded-2xl p-4 text-left mb-6">
        <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-3">What happens next</p>
        <ul className="space-y-2.5">
          {[
            'Your curator checks availability',
            'You\'ll receive a WhatsApp message within a few hours',
            'Payment details sent only after confirmation',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-tx-mid">
              <span className="w-5 h-5 rounded-full bg-lime flex items-center justify-center text-[10px] font-bold text-ink flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => router.push('/home')}
        className="w-full py-4 bg-ink text-white rounded-full font-bold text-[15px] mb-3 active:scale-[0.98] transition-transform"
      >
        Back to Home
      </button>
      <button
        onClick={handleWhatsApp}
        className="w-full py-3.5 bg-mist text-ink rounded-full font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        💬 Message your curator
      </button>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-tx-light text-sm">Loading…</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
