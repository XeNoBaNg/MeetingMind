export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-200/80 rounded-xl animate-pulse ${className}`}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 border border-[#648296]/16 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl bg-white/80 border border-[#648296]/16 p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
