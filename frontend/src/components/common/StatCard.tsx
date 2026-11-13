import type { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  subtitle?: string
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  subtitle
}: StatCardProps) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-white/96 via-white/88 to-white/82 backdrop-blur-md border border-[#648296]/16 p-5 sm:p-6 shadow-[0_1px_2px_rgba(23,43,58,0.025),0_6px_20px_-2px_rgba(23,43,58,0.045),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(23,43,58,0.03),0_12px_28px_-4px_rgba(23,43,58,0.075),inset_0_1px_0_0_#ffffff] hover:border-[#168AAD]/30 transition-all duration-200 ease-out">
      {/* Top light reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent rounded-t-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100/70 border border-slate-200/50 flex items-center justify-center text-[#5A6E7F] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          {value}
        </div>

        {(change || subtitle) && (
          <div className="flex items-center gap-1.5 text-xs text-[#5A6E7F]">
            {change && (
              <span className={`font-medium ${
                trend === 'up' ? 'text-emerald-600' :
                trend === 'down' ? 'text-rose-600' :
                'text-[#5A6E7F]'
              }`}>
                {change}
              </span>
            )}
            {change && subtitle && <span className="text-[#648296]/40">•</span>}
            {subtitle && (
              <span className="text-[#718096] truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
