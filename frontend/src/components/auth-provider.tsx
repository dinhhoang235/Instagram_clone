'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import api from '@/lib/api'

type User = {
  email: string
  username: string
  avatar?: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  login: (tokens: { access: string; refresh: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get<{
        email: string
        username: string
        image?: string
      }>('/profiles/me/')

      const data = res.data
      const profile = {
        email: data.email,
        username: data.username,
        avatar: data.image,
      }

      setUser(profile)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout])
  const login = useCallback(async (tokens: { access: string; refresh: string }) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)

    await fetchProfile()
  }, [fetchProfile])
  // Load user on app start
  useEffect(() => {
    const access = localStorage.getItem('access_token')
    if (access) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
