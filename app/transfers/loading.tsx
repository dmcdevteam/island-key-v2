export default function Loading() {
  return (
    <div className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="skeleton h-7 w-32 mb-1" />
      <div className="skeleton h-4 w-48 mb-6" />

      {/* Search card */}
      <div className="bg-white rounded-xl border border-border-light p-4 space-y-3">
        {/* From / To inputs */}
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border-light" />
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="h-px flex-1 bg-border-light" />
        </div>
        <div className="skeleton h-12 w-full rounded-lg" />

        {/* Date + time row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="skeleton h-12 rounded-lg" />
          <div className="skeleton h-12 rounded-lg" />
        </div>

        {/* Pax row */}
        <div className="skeleton h-12 w-full rounded-lg" />

        {/* CTA button */}
        <div className="skeleton h-14 w-full rounded-lg mt-1" />
      </div>
    </div>
  )
}
