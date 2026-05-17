'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <TenantProvider tenantId={tenantId} hostname={hostname}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <ThemeInjector />
          {children}
          <Toaster position="top-center" richColors />
        </QueryClientProvider>
      </ThemeProvider>
    </TenantProvider>
  )
}
