'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [isAdminPreview, setIsAdminPreview] = useState(false);

  useEffect(() => {
    setIsAdminPreview(localStorage.getItem('ik_admin_preview') === '1');
  }, []);

  return (
    <div
      onClick={() => router.push('/onboard')}
      className="min-h-screen flex items-center justify-center cursor-pointer relative overflow-hidden"
      style={{ background: '#0D0D0D' }}
    >
      {/* Lime radial glow — top left */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 25% 30%, rgba(200,241,53,0.13) 0%, transparent 55%)',
      }} />

      {/* Grain texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
        <filter id="sp-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sp-noise)" />
      </svg>

      {/* Admin Skip */}
      {isAdminPreview && (
        <button
          onClick={e => { e.stopPropagation(); router.push('/onboard'); }}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-white/40 text-[12px] hover:text-white/70 transition-colors"
        >
          <span className="text-[9px] font-bold bg-white/10 text-white/40 px-1.5 py-0.5 rounded uppercase tracking-wide">Admin</span>
          Skip →
        </button>
      )}

      {/* Content */}
      <div className="relative text-center z-10 animate-fade-up px-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_transparent.png" alt="Island Key" style={{ height: 148, width: 'auto' }} />
        </div>

        {/* Wordmark */}
        <div className="mb-6">
          <h1 className="font-display text-[48px] font-light text-white tracking-tight leading-none">
            Island Key
            <span className="inline-block w-2 h-2 bg-lime rounded-full ml-1 align-super" />
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-[12px] text-white/40 tracking-[0.22em] uppercase mb-14">
          Your island. Unlocked.
        </p>

        {/* Tap prompt */}
        <p className="text-[11px] text-white/20 animate-pulse-soft">
          Tap to continue
        </p>
      </div>
    </div>
  );
}
