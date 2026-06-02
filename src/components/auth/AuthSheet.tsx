'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { AuthInput } from './AuthInput'

type View = 'login' | 'register' | 'forgot' | 'verify'

interface AuthSheetProps {
  open: boolean
  onClose: () => void
}

// ── Error messages map ────────────────────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  EMAIL_EXISTS: 'Этот email уже зарегистрирован',
  PASSWORDS_MISMATCH: 'Пароли не совпадают',
  PASSWORD_TOO_SHORT: 'Пароль должен содержать не менее 8 символов',
  MISSING_FIELDS: 'Заполните все поля',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  INVALID_PIN: 'Неверный или истёкший код',
}

function errorText(code: string) {
  return ERROR_MESSAGES[code] ?? 'Что-то пошло не так'
}

// ── Shared submit button ──────────────────────────────────────────────────────
function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-fab transition-opacity disabled:opacity-60"
    >
      {loading ? <Loader2 size={20} className="animate-spin" /> : label}
    </button>
  )
}

// ── Pin Verification View ─────────────────────────────────────────────────────
function PinView({ email, onClose }: { email: string; onClose: () => void }) {
  const hydrate = useAuth((s) => s.hydrate)
  const markEmailVerified = useAuth((s) => s.markEmailVerified)
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(errorText(data.error))
        return
      }
      markEmailVerified()
      await hydrate()
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    setResendDone(false)
    try {
      await fetch('/api/auth/resend-verification', { method: 'POST' })
      setResendDone(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-[22px] font-bold text-ink-900">Введите код</h2>
        <p className="mt-1 text-[14px] text-ink-500">
          Мы отправили 4-значный код на{' '}
          <span className="font-medium text-ink-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-marker-red/10 px-4 py-3 text-[13px] text-marker-red">
          {error}
        </div>
      )}

      <AuthInput
        label="Код подтверждения"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          setError('')
          setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
        }}
        required
      />

      <SubmitButton loading={loading} label="Подтвердить" />

      <div className="text-center">
        {resendDone ? (
          <p className="text-[13px] text-marker-green">✓ Код отправлен повторно</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-[13px] text-brand disabled:opacity-60"
          >
            {resendLoading ? 'Отправляем...' : 'Отправить код снова'}
          </button>
        )}
      </div>
    </form>
  )
}

// ── Login View ────────────────────────────────────────────────────────────────
function LoginView({
  onSwitch,
  onClose,
  onVerify,
}: {
  onSwitch: (v: View) => void
  onClose: () => void
  onVerify: (email: string) => void
}) {
  const hydrate = useAuth((s) => s.hydrate)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(errorText(data.error))
        return
      }
      await hydrate()
      if (!data.emailVerified) {
        onVerify(email)
      } else {
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-[22px] font-bold text-ink-900">Вход</h2>

      {error && (
        <div className="rounded-2xl bg-marker-red/10 px-4 py-3 text-[13px] text-marker-red">
          {error}
        </div>
      )}

      <AuthInput
        label="Email"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <AuthInput
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="button"
        onClick={() => onSwitch('forgot')}
        className="w-full text-left text-[13px] text-brand"
      >
        Забыли пароль?
      </button>

      <SubmitButton loading={loading} label="Войти" />

      <p className="text-center text-[13px] text-ink-500">
        Нет аккаунта?{' '}
        <button type="button" onClick={() => onSwitch('register')} className="text-brand font-medium">
          Зарегистрироваться
        </button>
      </p>
    </form>
  )
}

// ── Register View ─────────────────────────────────────────────────────────────
function RegisterView({
  onSwitch,
  onVerify,
}: {
  onSwitch: (v: View) => void
  onVerify: (email: string) => void
}) {
  const hydrate = useAuth((s) => s.hydrate)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEmailError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword: confirm, sex }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setEmailError(errorText(data.error))
        } else {
          setError(errorText(data.error))
        }
        return
      }
      await hydrate()
      onVerify(email)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-[22px] font-bold text-ink-900">Регистрация</h2>

      {error && (
        <div className="rounded-2xl bg-marker-red/10 px-4 py-3 text-[13px] text-marker-red">
          {error}
        </div>
      )}

      <AuthInput
        label="Email"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
        error={emailError}
        required
      />
      <AuthInput
        label="Пароль"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <AuthInput
        label="Подтверждение пароля"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <div>
        <div className="mb-1.5 text-[13px] font-medium text-ink-500">Пол</div>
        <div className="flex gap-2">
          {(['male', 'female'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSex(s)}
              className={`tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium transition-colors ${
                sex === s ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              {s === 'male' ? 'Мужчина' : 'Женщина'}
            </button>
          ))}
        </div>
      </div>

      <SubmitButton loading={loading} label="Зарегистрироваться" />

      <p className="text-center text-[13px] text-ink-500">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={() => onSwitch('login')} className="text-brand font-medium">
          Войти
        </button>
      </p>
    </form>
  )
}

// ── Forgot Password View ──────────────────────────────────────────────────────
function ForgotView({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle size={32} className="text-brand" />
        </div>
        <div>
          <p className="text-[18px] font-bold text-ink-900">Письмо отправлено</p>
          <p className="mt-1 text-[14px] text-ink-500">
            Если этот email зарегистрирован, мы отправили ссылку для сброса пароля.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="text-[14px] text-brand font-medium"
        >
          ← Вернуться ко входу
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-[22px] font-bold text-ink-900">Восстановление пароля</h2>
        <p className="mt-1 text-[14px] text-ink-500">
          Введите email — отправим ссылку для сброса пароля.
        </p>
      </div>

      <AuthInput
        label="Email"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <SubmitButton loading={loading} label="Отправить ссылку" />

      <button
        type="button"
        onClick={() => onSwitch('login')}
        className="w-full text-center text-[13px] text-ink-500"
      >
        ← Вернуться ко входу
      </button>
    </form>
  )
}

// ── Main AuthSheet ─────────────────────────────────────────────────────────────
export function AuthSheet({ open, onClose }: AuthSheetProps) {
  const [view, setView] = useState<View>('login')
  const [verifyEmail, setVerifyEmail] = useState('')

  function handleClose() {
    onClose()
    setTimeout(() => setView('login'), 300)
  }

  function handleVerify(email: string) {
    setVerifyEmail(email)
    setView('verify')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[440px] rounded-t-3xl bg-white shadow-elevated"
            style={{
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-[4px] w-9 rounded-full bg-ink-200" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors hover:bg-ink-200"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="px-6 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  {view === 'login' && <LoginView onSwitch={setView} onClose={handleClose} onVerify={handleVerify} />}
                  {view === 'register' && <RegisterView onSwitch={setView} onVerify={handleVerify} />}
                  {view === 'forgot' && <ForgotView onSwitch={setView} />}
                  {view === 'verify' && <PinView email={verifyEmail} onClose={handleClose} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
