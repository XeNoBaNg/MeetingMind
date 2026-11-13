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
      bg-gradient-to-b from-[#1898bd] via-[#168aad] to-[#137694] text-white font-medium
      hover:from-[#199ec5] hover:to-[#126f8c] active:scale-[0.98]
      shadow-[0_1px_2px_rgba(20,123,155,0.25),inset_0_1px_0_0_rgba(255,255,255,0.25)]
      border border-[#147b9b]/80
    `,
    secondary: `
      bg-gradient-to-b from-white via-white/95 to-slate-50/90 hover:to-slate-100/90 text-[#172B3A] font-medium
      border border-[#648296]/24 hover:border-[#648296]/36
      shadow-[0_1px_2px_rgba(23,43,58,0.03),inset_0_1px_0_0_#ffffff] active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-b from-rose-50 to-rose-100/80 hover:to-rose-100 text-rose-700 font-medium
      border border-rose-200 hover:border-rose-300
      shadow-[0_1px_2px_rgba(244,63,94,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent hover:bg-black/[0.04] text-[#5A6E7F] hover:text-[#172B3A] font-medium
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent hover:bg-[#168AAD]/8 text-[#168AAD] font-medium
      border border-[#168AAD]/30 hover:border-[#168AAD]/60
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
        inline-flex items-center justify-center transition-all duration-180 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed select-none
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      
      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 flex-shrink-0" />
      )}
    </button>
  )
}
