'use client'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { TenantProvider } from '@/hooks/use-tenant'
import { ThemeProvider } from 'next-themes'
import { ThemeInjector } from './theme-injector'

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
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }))

  const persister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  })

  return (
    <TenantProvider tenantId={tenantId} hostname={hostname}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PersistQueryClientProvider 
          client={queryClient}
          persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <ThemeInjector />
          {children}
          <Toaster position="top-center" richColors />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </TenantProvider>
  )
}
