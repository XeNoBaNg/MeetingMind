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
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#5A6E7F]">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#718096]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-xl bg-white/95 border border-[#648296]/24 px-3.5 py-2 text-sm text-[#172B3A] placeholder-[#718096]
            shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_1.5px_rgba(23,43,58,0.025)]
            transition-all duration-180
            focus:outline-none focus:bg-white focus:border-[#168AAD] focus:ring-2 focus:ring-[#168AAD]/15 focus:shadow-[0_1px_2px_rgba(23,43,58,0.03)]
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#718096]">{helperText}</p>}
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
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-[#5A6E7F]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full rounded-xl bg-white/95 border border-[#648296]/24 px-3.5 py-2.5 text-sm text-[#172B3A] placeholder-[#718096]
          shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_1.5px_rgba(23,43,58,0.025)]
          transition-all duration-180
          focus:outline-none focus:bg-white focus:border-[#168AAD] focus:ring-2 focus:ring-[#168AAD]/15 focus:shadow-[0_1px_2px_rgba(23,43,58,0.03)]
          ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#718096]">{helperText}</p>}
    </div>
  )
}
