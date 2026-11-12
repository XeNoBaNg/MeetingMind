import React from 'react'

export type BadgeVariant = 'cyan' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
  className?: string
}

export function Badge({
  children,
  variant = 'cyan',
  size = 'md',
  dot = true,
  pulse = false,
  className = ''
}: BadgeProps) {
  const variantStyles = {
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
      dot: 'bg-cyan-400'
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
      dot: 'bg-emerald-400'
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      dot: 'bg-amber-400'
    },
    red: {
      bg: 'bg-red-500/10 text-red-300 border-red-500/25',
      dot: 'bg-red-400'
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
      dot: 'bg-blue-400'
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
      dot: 'bg-purple-400'
    },
    slate: {
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
      dot: 'bg-slate-400'
    }
  }[variant]

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  }[size]

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border shadow-sm backdrop-blur-md
        ${variantStyles.bg}
        ${sizeStyles}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variantStyles.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${variantStyles.dot}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="emerald">Completed</Badge>
    case 'DONE':
      return <Badge variant="emerald">Done</Badge>
    case 'FAILED':
      return <Badge variant="red">Failed</Badge>
    case 'OPEN':
      return <Badge variant="blue" dot pulse>Open</Badge>
    case 'ANALYZING':
      return <Badge variant="amber" dot pulse>Analyzing</Badge>
    case 'SUMMARIZING':
      return <Badge variant="cyan" dot pulse>Summarizing</Badge>
    case 'EXTRACTING':
      return <Badge variant="cyan" dot pulse>Extracting</Badge>
    case 'DRAFTING':
      return <Badge variant="purple" dot pulse>Drafting</Badge>
    case 'REVIEWING':
      return <Badge variant="amber" dot pulse>Reviewing</Badge>
    default:
      return <Badge variant="slate">{status}</Badge>
  }
}

