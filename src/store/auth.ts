'use client'
import { create } from 'zustand'

export type Units = 'metric' | 'imperial'

export interface AuthUser {
  email: string
  emailVerified: boolean
  sex?: 'male' | 'female' | null
  avatarUrl?: string | null
  units?: Units | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  hydrate: () => Promise<void>
  logout: () => Promise<void>
  markEmailVerified: () => void
  updateSex: (sex: 'male' | 'female') => Promise<void>
  updateUnits: (units: Units) => Promise<void>
  updateAvatar: (avatarUrl: string | null) => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const user = await res.json()
        set({ user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },

  markEmailVerified: () =>
    set((s) => s.user ? { user: { ...s.user, emailVerified: true } } : {}),

  updateSex: async (sex) => {
    // Optimistic update
    set((s) => (s.user ? { user: { ...s.user, sex } } : {}))
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sex }),
    }).catch(() => {})
  },

  updateUnits: async (units) => {
    set((s) => (s.user ? { user: { ...s.user, units } } : {}))
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ units }),
    }).catch(() => {})
  },

  updateAvatar: async (avatarUrl) => {
    set((s) => (s.user ? { user: { ...s.user, avatarUrl } } : {}))
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl }),
    }).catch(() => {})
  },
}))
