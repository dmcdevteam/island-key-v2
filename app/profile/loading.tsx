export default function Loading() {
  return (
    <div className="pb-24">
      {/* Profile header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-4">
        <div className="skeleton w-14 h-14 rounded-full flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-3.5 w-40" />
        </div>
      </div>

      <div className="px-5 space-y-3">
        {/* Section label */}
        <div className="skeleton h-4 w-28 mb-1" />

        {/* Booking cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border-light p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-44" />
                <div className="skeleton h-3.5 w-28" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border-light">
              <div className="skeleton h-3.5 w-24" />
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
