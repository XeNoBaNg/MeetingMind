import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  color?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'purple'
  subtitle?: string
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'cyan',
  subtitle
}: StatCardProps) {
  const colorStyles = {
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      glow: 'group-hover:border-cyan-500/40 group-hover:shadow-cyan-500/10',
      accent: 'from-cyan-500 to-blue-500'
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      glow: 'group-hover:border-blue-500/40 group-hover:shadow-blue-500/10',
      accent: 'from-blue-500 to-indigo-500'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      glow: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10',
      accent: 'from-emerald-500 to-teal-500'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      glow: 'group-hover:border-amber-500/40 group-hover:shadow-amber-500/10',
      accent: 'from-amber-500 to-orange-500'
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
      glow: 'group-hover:border-purple-500/40 group-hover:shadow-purple-500/10',
      accent: 'from-purple-500 to-pink-500'
    }
  }[color]

  return (
    <div className={`
      group relative rounded-2xl bg-[#0b1728]/70 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6
      shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300
      ${colorStyles.glow}
    `}>
      {/* Subtle top-edge reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner ${colorStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        
        {(change || subtitle) && (
          <div className="flex items-center gap-1.5 text-xs">
            {change && (
              <span className={`inline-flex items-center font-medium ${
                trend === 'up' ? 'text-emerald-400' :
                trend === 'down' ? 'text-rose-400' :
                'text-slate-400'
              }`}>
                {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {trend === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 font-normal">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
