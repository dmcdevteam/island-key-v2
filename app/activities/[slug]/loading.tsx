export default function Loading() {
  return (
    <div className="pb-24">
      {/* Hero image block */}
      <div className="skeleton w-full" style={{ height: 220 }} />

      <div className="px-5 pt-4 space-y-3">
        {/* Title */}
        <div className="skeleton h-7 w-4/5" />
        {/* Subtitle row */}
        <div className="flex gap-2">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-24" />
        </div>
        {/* Price */}
        <div className="skeleton h-6 w-28" />

        {/* Divider */}
        <div className="h-px bg-border-light" />

        {/* Description lines */}
        <div className="space-y-2 pt-1">
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-3/4" />
        </div>

        {/* Includes section */}
        <div className="skeleton h-4 w-32 mt-2" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-3.5 w-2/3" />
          ))}
        </div>
      </div>

      {/* CTA bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 py-4 bg-white border-t border-border-light flex gap-3">
        <div className="skeleton flex-1 h-12 rounded-sm" />
        <div className="skeleton w-12 h-12 rounded-sm" />
      </div>
    </div>
  )
}
