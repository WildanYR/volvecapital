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
      role: 'TENANT_OWNER',
    }
    setStoredTenant(tenantStore)
    setTenant(tenantStore)
  }, [])

  const loginAsStaff = React.useCallback(async (email: string, password: string, tenantId: string) => {
    const response = await fetch(`${API_URL}/dashboard-user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Email atau password salah')
    }

    const data = await response.json()
    const tenantStore: ITenant = {
      id: tenantId,
      accessToken: data.token,
      role: 'DASHBOARD_USER',
      permissions: data.permissions ?? [],
      staffName: data.name,
    }
    setStoredTenant(tenantStore)
    setTenant(tenantStore)
  }, [])

  React.useEffect(() => {
    const stored = getStoredTenant()
    setTenant(stored)

    if (stored && stored.role === 'DASHBOARD_USER') {
      fetch(`${API_URL}/dashboard-user/me`, {
        headers: {
          'Authorization': `VC ${stored.accessToken}`,
          'x-tenant-id': stored.id,
        },
      })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
        .then(data => {
          const updatedTenant: ITenant = {
            ...stored,
            accessToken: data.token ?? stored.accessToken,
            permissions: data.permissions ?? [],
            staffName: data.name,
          }
          setStoredTenant(updatedTenant)
          setTenant(updatedTenant)
        })
        .catch(() => {
          // If the user's session is invalid (e.g. deactivated), log them out
          logout()
        })
    }
  }, [logout])

  return (
    <AuthContext value={{ isAuthenticated, tenant, login, loginAsStaff, logout }}>
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
