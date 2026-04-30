import type { IAuthContext, ITenant } from './auth-context.type'
import React from 'react'
import { API_URL } from '@/dashboard/constants/api-url.cont'

const AuthContext = React.createContext<IAuthContext | null>(null)

const localStorageKey = 'auth.tenant'

function getStoredTenant() {
  const tenant = localStorage.getItem(localStorageKey)
  if (!tenant)
    return null
  return JSON.parse(tenant)
}

function setStoredTenant(tenant: ITenant | null) {
  if (tenant) {
    localStorage.setItem(localStorageKey, JSON.stringify(tenant))
  }
  else {
    localStorage.removeItem(localStorageKey)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = React.useState<ITenant | null>(getStoredTenant())
  const isAuthenticated = !!tenant

  const logout = React.useCallback(() => {
    setStoredTenant(null)
    setTenant(null)
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/tenant/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Email atau password salah')
    }

    const tenantData = await response.json()
    const tenantStore: ITenant = {
      id: tenantData.id,
      accessToken: tenantData.token,
    }
    setStoredTenant(tenantStore)
    setTenant(tenantStore)
  }, [])

  React.useEffect(() => {
    setTenant(getStoredTenant())
  }, [])

  return (
    <AuthContext value={{ isAuthenticated, tenant, login, logout }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const context = React.use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
