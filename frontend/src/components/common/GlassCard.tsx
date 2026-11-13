import React from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  ...props
}: GlassCardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  }[padding]

  return (
    <div
      className={`
        relative rounded-2xl
        bg-gradient-to-br from-white/96 via-white/88 to-white/80
        backdrop-blur-md
        border border-[#648296]/16
        text-[#172B3A]
        shadow-[0_1px_2px_rgba(23,43,58,0.025),0_6px_20px_-2px_rgba(23,43,58,0.045),inset_0_1px_0_0_rgba(255,255,255,0.95)]
        ${hover ? 'hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(23,43,58,0.03),0_12px_28px_-4px_rgba(23,43,58,0.075),inset_0_1px_0_0_#ffffff] hover:border-[#168AAD]/30 transition-all duration-200 ease-out' : ''}
        ${paddingClasses}
        ${className}
      `}
      {...props}
    >
      {/* Delicate top-edge light reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent rounded-t-2xl pointer-events-none" />
      {children}
    </div>
  )
}
