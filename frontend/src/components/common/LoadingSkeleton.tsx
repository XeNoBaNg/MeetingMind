export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.05] rounded-xl animate-pulse ${className}`}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0b1728]/70 border border-white/[0.08] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl bg-[#0b1728]/70 border border-white/[0.08] p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
