'use client'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="space-y-1.5">
        <div
          className={`rounded-2xl border px-4 py-3 transition-colors ${
            error
              ? 'border-marker-red bg-marker-red/5'
              : 'border-ink-200 bg-white focus-within:border-brand'
          }`}
        >
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {label}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={ref}
              type={inputType}
              className="min-w-0 flex-1 bg-transparent text-[16px] text-ink-900 placeholder:text-ink-300 focus:outline-none"
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink-400 transition-colors hover:text-ink-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>
        {error && <p className="px-1 text-[12px] text-marker-red">{error}</p>}
      </div>
    )
  }
)
AuthInput.displayName = 'AuthInput'
