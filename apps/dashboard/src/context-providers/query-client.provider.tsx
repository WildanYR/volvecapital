import type React from 'react'
import { QueryClientProvider as QCP, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <QCP client={queryClient}>{children}</QCP>
}
