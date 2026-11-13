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
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-[#648296]/16 p-8 sm:p-12 text-center shadow-xs">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-[#648296]/20 flex items-center justify-center text-[#5A6E7F] mb-4">
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[#172B3A] mb-1.5">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-[#5A6E7F] mb-5 leading-relaxed">
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
