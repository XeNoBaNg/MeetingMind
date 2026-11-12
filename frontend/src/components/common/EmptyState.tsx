import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: LucideIcon
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  children
}: EmptyStateProps) {
  return (
    <div className="relative rounded-2xl bg-[#0b1728]/60 backdrop-blur-xl border border-white/[0.08] p-10 sm:p-14 text-center overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 shadow-lg shadow-cyan-950/40">
          <Icon className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {actionLabel && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionLabel}
          </Button>
        )}

        {children}
      </div>
    </div>
  )
}

