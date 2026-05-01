export default function Loading() {
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="skeleton h-7 w-36 mb-1" />
        <div className="skeleton h-4 w-24" />
      </div>

      {/* Category chip row */}
      <div className="flex gap-2 px-5 mb-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-8 rounded-full flex-shrink-0" style={{ width: 72 + (i % 3) * 16 }} />
        ))}
      </div>

      {/* Activity card grid */}
      <div className="grid grid-cols-2 gap-3 px-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded border border-border-light overflow-hidden">
            <div className="skeleton w-full" style={{ aspectRatio: '16/9' }} />
            <div className="p-2.5 space-y-1.5">
              <div className="skeleton h-3.5 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3.5 w-1/2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
