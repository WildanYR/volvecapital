'use client'

import { useEffect, useState } from 'react'

export function useTenant() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [hostname, setHostname] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host
      setHostname(host)
      
      const parts = host.split('.')
      // Example: papapremium.localhost:3000 -> papapremium
      // Example: papapremium.volve-capital.com -> papapremium
      if (parts.length >= 2) {
        const subdomain = parts[0]
        if (subdomain !== 'www' && subdomain !== 'localhost') {
          setTenantId(subdomain)
        }
      }
    }
  }, [])

  return { tenantId, hostname }
}
