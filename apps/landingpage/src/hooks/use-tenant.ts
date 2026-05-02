'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface TenantContextType {
  tenantId: string | null
  hostname: string | null
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ 
  children, 
  tenantId, 
  hostname 
}: { 
  children: ReactNode, 
  tenantId: string | null, 
  hostname: string | null 
}) {
  return (
    <TenantContext.Provider value={{ tenantId, hostname }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    // Fallback to old behavior if not inside Provider, 
    // but ideally we should always be inside Provider
    return { tenantId: null, hostname: null }
  }
  return context
}
