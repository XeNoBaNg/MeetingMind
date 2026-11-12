import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
  helperText?: string
}

export function Input({
  label,
  error,
  icon: Icon,
  helperText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-xl bg-[#081220]/70 backdrop-blur-md border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500
            transition-all duration-200
            focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:bg-[#0b1728]/90
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full rounded-xl bg-[#081220]/70 backdrop-blur-md border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500
          transition-all duration-200
          focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:bg-[#0b1728]/90
          ${error ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  )
}

