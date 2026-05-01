interface Spec {
  icon: string
  label: string
  note: string
  ok?: boolean
}

const SPECS: Spec[] = [
  { icon: '📐', label: 'Min 1200px wide',   note: 'wider is better',       ok: true  },
  { icon: '🖼️', label: 'JPG · WebP · AVIF', note: 'no PNG, HEIC, or TIFF', ok: true  },
  { icon: '⚖️', label: 'Max 10 MB',         note: 'compress before upload', ok: true  },
  { icon: '🏔️', label: 'Landscape 3:2+',   note: 'portrait crops poorly',  ok: true  },
  { icon: '🚫', label: 'No text overlay',   note: 'text gets cropped out',  ok: false },
  { icon: '☀️', label: 'Natural light',     note: 'avoid dark/backlit',     ok: true  },
]

export function ImageUploadGuide() {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold text-tx-mid uppercase tracking-widest mb-1.5">Image requirements</p>
      <div className="flex flex-wrap gap-1.5">
        {SPECS.map(s => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-[11px]"
            style={{
              background: s.ok ? '#F0FDF4' : '#FFF7ED',
              borderColor: s.ok ? '#BBF7D0' : '#FED7AA',
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</span>
            <div>
              <span className="font-semibold" style={{ color: s.ok ? '#15803D' : '#C2410C' }}>{s.label}</span>
              <span className="ml-1" style={{ color: s.ok ? '#4ADE80' : '#FB923C', opacity: 0.8 }}>·</span>
              <span className="ml-1 text-tx-light">{s.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
