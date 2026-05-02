'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { TenantProvider } from '@/hooks/use-tenant'

export function Providers({ 
  children,
  tenantId,
  hostname
}: { 
  children: React.ReactNode,
  tenantId: string | null,
  hostname: string | null
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <TenantProvider tenantId={tenantId} hostname={hostname}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </TenantProvider>
  )
}
