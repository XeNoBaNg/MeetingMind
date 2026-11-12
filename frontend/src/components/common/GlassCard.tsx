import React from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'cyan' | 'blue' | 'teal' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = 'none',
  padding = 'md',
  ...props
}: GlassCardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[padding]

  const glowClasses = {
    cyan: 'border-cyan-500/20 shadow-cyan-500/10 hover:border-cyan-500/40',
    blue: 'border-blue-500/20 shadow-blue-500/10 hover:border-blue-500/40',
    teal: 'border-teal-500/20 shadow-teal-500/10 hover:border-teal-500/40',
    none: 'border-white/[0.08] hover:border-cyan-500/25'
  }[glow]

  return (
    <div
      className={`
        relative rounded-2xl bg-[#0b1728]/70 backdrop-blur-xl border 
        ${glowClasses}
        ${hover ? 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 transition-all duration-300' : ''}
        ${paddingClasses}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top-edge glass reflection highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-2xl pointer-events-none" />
      {children}
    </div>
  )
}

