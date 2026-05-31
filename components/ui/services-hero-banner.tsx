'use client'

export function ServicesHeroBanner() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
      {/* Background gradient mesh */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, #0D5C52 0%, transparent 60%),' +
            'radial-gradient(ellipse at 80% 30%, #1A3A5C 0%, transparent 55%),' +
            'linear-gradient(135deg, #1B2D4F 0%, #0D3D38 55%, #1B2D4F 100%)',
        }}
      />

      {/* SVG grain overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" aria-hidden="true">
        <filter id="svc-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#svc-noise)" />
      </svg>

      {/* Content row */}
      <div className="relative z-10 flex items-center h-full px-5" style={{ paddingBottom: 36 }}>

        {/* Text */}
        <div style={{ width: '100%', paddingRight: 16 }}>
          {/* Eyebrow */}
          <p
            style={{
              fontSize: 10,
              color: '#1A8A7D',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Concierge Services
          </p>

          {/* Headline */}
          <p
            className="font-display"
            style={{
              fontSize: 26,
              color: '#FDFCFA',
              lineHeight: 1.2,
              fontWeight: 400,
              marginBottom: 10,
            }}
          >
            Every detail,<br />handled.
          </p>

          {/* Sub-copy */}
          <p
            style={{
              fontSize: 13,
              color: 'rgba(253,252,250,0.78)',
              lineHeight: 1.45,
              fontWeight: 400,
            }}
          >
            In-villa services, reservations and local experiences — curated for your stay.
          </p>
        </div>

      </div>

      {/* Bottom rule + micro-stats */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid rgba(26,138,125,0.30)',
          padding: '7px 20px',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'rgba(253,252,250,0.72)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          6 Categories&nbsp;&nbsp;·&nbsp;&nbsp;40+ Experiences&nbsp;&nbsp;·&nbsp;&nbsp;2h Response
        </p>
      </div>
    </div>
  )
}
