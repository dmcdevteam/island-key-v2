'use client'

import { useRouter } from 'next/navigation'

export default function BoatsComingSoonPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rentals/search?category=boat')} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">Boat Rentals</h1>
            <p className="text-[11px] text-tx-light">Explore Crete by sea</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center text-4xl">
          ⛵
        </div>
        <div>
          <h2 className="font-display text-2xl text-navy mb-2">Coming Soon</h2>
          <p className="text-sm text-tx-light leading-relaxed max-w-[280px]">
            Boat rentals are on their way. Our fleet of skippered and self-drive vessels will be available to book very soon.
          </p>
        </div>
        <div className="w-full max-w-[320px] bg-white rounded-2xl border border-border-light p-5 shadow-sm text-left space-y-3">
          <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest">In the meantime</p>
          <p className="text-sm text-tx-mid leading-relaxed">
            Contact us directly and we'll arrange a private boat charter tailored to your group and schedule.
          </p>
          <a
            href="https://wa.me/306900000000"
            className="flex items-center justify-center gap-2 w-full py-3 bg-teal text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            <span>💬</span>
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )
}
