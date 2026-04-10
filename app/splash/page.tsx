'use client';

import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push('/onboard')}
      className="min-h-screen flex items-center justify-center cursor-pointer relative overflow-hidden"
      style={{ background: 'linear-gradient(155deg, #1B2D4F 0%, #1a3a5c 40%, #1A8A7D 100%)' }}
    >
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />

      {/* Content */}
      <div className="relative text-center z-10 animate-fade-up">
        {/* Logo image */}
        <div className="flex justify-center mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_transparent.png" alt="Island Key" style={{ height: 160, width: 'auto' }} />
        </div>

        {/* Wordmark */}
        <div className="mb-8">
          <h1 className="font-display text-[42px] font-medium text-white tracking-tight leading-none">
            <span className="font-bold">Island</span>{' '}Key
            <span className="inline-block w-2 h-2 bg-teal rounded-full ml-0.5 align-super" />
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-[13px] text-white/45 tracking-[0.2em] uppercase mb-12">
          Your island. Unlocked.
        </p>

        {/* Tap prompt */}
        <p className="text-xs text-white/25 animate-pulse-soft">
          Tap to continue
        </p>
      </div>
    </div>
  );
}
