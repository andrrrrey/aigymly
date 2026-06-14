'use client'
import { useEffect } from 'react'
import { format, startOfWeek } from 'date-fns'
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

  // Refresh on PWA/tab resume: a resident PWA never reloads, so re-fetch
  // workouts and re-anchor the selected date to today when the app becomes
  // visible again (otherwise it shows stale data and a stale "today").
  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState !== 'visible') return
      if (!useAuth.getState().user) return
      loadWorkouts()
      const { selectedDate, setSelectedDate } = useApp.getState()
      const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (selectedDate < thisWeekStart) {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
      }
    }
    document.addEventListener('visibilitychange', onResume)
    window.addEventListener('focus', onResume)
    return () => {
      document.removeEventListener('visibilitychange', onResume)
      window.removeEventListener('focus', onResume)
    }
  }, [loadWorkouts])

  return <>{children}</>
}
