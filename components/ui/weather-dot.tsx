'use client'

interface WeatherDotProps {
  status: 'good' | 'check' | 'affected'
  reason: string | null
}

const COLOURS: Record<WeatherDotProps['status'], string> = {
  good:     'bg-green-500',
  check:    'bg-amber-400',
  affected: 'bg-red-500',
}

export function WeatherDot({ status, reason }: WeatherDotProps) {
  return (
    <div className="relative group">
      <div className={`w-2.5 h-2.5 rounded-full ${COLOURS[status]} flex-shrink-0`} />
      {reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-navy text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
          {reason}
        </div>
      )}
    </div>
  )
}
