'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { AuthInput } from '@/components/auth/AuthInput'
import { useAuth } from '@/store/auth'

const ERROR_MESSAGES: Record<string, string> = {
  PASSWORDS_MISMATCH: 'Пароли не совпадают',
  PASSWORD_TOO_SHORT: 'Пароль должен содержать не менее 8 символов',
  MISSING_FIELDS: 'Заполните все поля',
  INVALID_TOKEN: 'Ссылка устарела или уже была использована',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hydrate = useAuth((s) => s.hydrate)
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle size={48} className="text-marker-red" />
        <p className="text-[16px] font-semibold text-ink-900">Недействительная ссылка</p>
        <button
          onClick={() => router.push('/profile')}
          className="text-[14px] text-brand font-medium"
        >
          На главную
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-marker-green/15">
          <CheckCircle size={32} className="text-marker-green" />
        </div>
        <div>
          <p className="text-[20px] font-bold text-ink-900">Пароль изменён</p>
          <p className="mt-1 text-[14px] text-ink-500">
            Войдите с новым паролем
          </p>
        </div>
        <button
          onClick={() => router.push('/profile')}
          className="mt-2 flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-fab"
        >
          Перейти в профиль
        </button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(ERROR_MESSAGES[data.error] ?? 'Что-то пошло не так')
        return
      }
      await hydrate()
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-[24px] font-bold text-ink-900">Новый пароль</h1>
        <p className="mt-1 text-[14px] text-ink-500">Введите новый пароль для вашего аккаунта</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-marker-red/10 px-4 py-3 text-[13px] text-marker-red">
          {error}
        </div>
      )}

      <AuthInput
        label="Новый пароль"
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

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-fab transition-opacity disabled:opacity-60"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Сохранить пароль'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="flex-1 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl bg-white p-6 shadow-card"
        >
          <Suspense fallback={<div className="py-8 text-center text-ink-400">Загрузка...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}
