import React from 'react'

export type BadgeVariant = 'cyan' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

export function Badge({
  children,
  variant = 'cyan',
  size = 'md',
  dot = true,
  className = ''
}: BadgeProps) {
  const variantStyles = {
    cyan: {
      bg: 'bg-sky-50/90 text-sky-800 border-sky-200/90',
      dot: 'bg-sky-500'
    },
    emerald: {
      bg: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90',
      dot: 'bg-emerald-500'
    },
    amber: {
      bg: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
      dot: 'bg-amber-500'
    },
    red: {
      bg: 'bg-rose-50/90 text-rose-800 border-rose-200/90',
      dot: 'bg-rose-500'
    },
    blue: {
      bg: 'bg-blue-50/90 text-blue-800 border-blue-200/90',
      dot: 'bg-blue-500'
    },
    purple: {
      bg: 'bg-purple-50/90 text-purple-800 border-purple-200/90',
      dot: 'bg-purple-500'
    },
    slate: {
      bg: 'bg-slate-100/90 text-slate-700 border-slate-200/90',
      dot: 'bg-slate-400'
    }
  }[variant]

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5'
  }[size]

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]
        ${variantStyles.bg}
        ${sizeStyles}
        ${className}
      `}
    >
      {dot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${variantStyles.dot}`} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="emerald">Completed</Badge>
    case 'FAILED':
      return <Badge variant="red">Failed</Badge>
    case 'ANALYZING':
    case 'SUMMARIZING':
    case 'EXTRACTING':
    case 'DRAFTING':
    case 'REVIEWING':
      return <Badge variant="amber">Processing</Badge>
    case 'OPEN':
      return <Badge variant="amber">Pending</Badge>
    case 'DONE':
      return <Badge variant="emerald">Done</Badge>
    default:
      return <Badge variant="slate">{status}</Badge>
  }
}
