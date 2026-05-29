'use client'
import { useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { useApp } from '@/store/app'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuth((s) => s.hydrate)
  const user = useAuth((s) => s.user)
  const loading = useAuth((s) => s.loading)
  const loadWorkouts = useApp((s) => s.loadWorkouts)
  const clearWorkouts = useApp((s) => s.clearWorkouts)

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (loading) return
    if (user) {
      loadWorkouts()
    } else {
      clearWorkouts()
    }
  }, [user, loading, loadWorkouts, clearWorkouts])

  return <>{children}</>
}
