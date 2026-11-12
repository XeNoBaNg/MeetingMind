import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-semibold
      hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500
      shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30
      border border-cyan-400/30 active:scale-[0.98]
    `,
    secondary: `
      bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white font-medium
      border border-white/10 hover:border-white/20
      shadow-md shadow-black/20 active:scale-[0.98]
    `,
    danger: `
      bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 font-medium
      border border-rose-500/30 hover:border-rose-500/50
      shadow-md shadow-rose-950/20 active:scale-[0.98]
    `,
    ghost: `
      bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white font-medium
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 font-medium
      border border-cyan-500/30 hover:border-cyan-500/50
      active:scale-[0.98]
    `
  }[variant]

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5'
  }[size]

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </button>
  )
}

