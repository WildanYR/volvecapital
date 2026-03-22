import type { QueryClient } from '@tanstack/react-query'

import type { IAuthContext } from '@/dashboard/context-providers/auth-context.type'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/dashboard/components/ui/sonner'
import { GlobalAlertDialogProvider } from '@/dashboard/context-providers/alert-dialog.provider'

interface MyRouterContext {
  queryClient: QueryClient
  auth?: IAuthContext
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <GlobalAlertDialogProvider>
        <Outlet />
      </GlobalAlertDialogProvider>
      <Toaster richColors position="top-center" />
    </>
  ),
})
