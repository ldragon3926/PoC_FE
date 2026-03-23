import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '@/api'
import { tokenStorage } from '@/api/client'
import type { AuthData, LoginRequest } from '@/types'

interface AuthContextType {
  user: AuthData | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthData | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on app mount
  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => tokenStorage.remove())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data)
    tokenStorage.set(res.data.token)
    setUser(res.data)
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    tokenStorage.remove()
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => user?.authorities?.includes(permission) ?? false,
    [user]
  )

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => user?.authorities?.includes(p)),
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
