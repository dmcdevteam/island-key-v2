export default function Loading() {
  return (
    <div className="pb-24">
      {/* Back + header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div>
          <div className="skeleton h-5 w-40 mb-1" />
          <div className="skeleton h-3.5 w-28" />
        </div>
      </div>

      <div className="px-5 space-y-3">
        {/* Route summary card */}
        <div className="skeleton h-20 w-full rounded-xl" />

        {/* Map block */}
        <div className="skeleton w-full rounded-xl" style={{ height: 160 }} />

        {/* Return trip row */}
        <div className="skeleton h-11 w-full rounded-lg" />

        {/* Vehicle cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border-light p-4">
            <div className="flex gap-3 items-start">
              <div className="skeleton w-16 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3.5 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
              <div className="skeleton h-10 w-20 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
