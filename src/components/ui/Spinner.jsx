export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-brand-blue ${sizes[size]}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface-muted rounded-2xl ${className}`} />
  )
}

export function ReportCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl shadow-card p-4 flex gap-4">
      <Skeleton className="h-16 w-16 flex-shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
  )
}
