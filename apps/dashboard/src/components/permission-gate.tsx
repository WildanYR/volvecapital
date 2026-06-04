import type { ReactNode } from 'react'
import { usePermission } from '@/dashboard/lib/permission'

interface PermissionGateProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only if the user has the required permission.
 * Renders fallback (or null) otherwise.
 *
 * @example
 * <PermissionGate permission="product.create">
 *   <CreateButton />
 * </PermissionGate>
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = usePermission(permission)
  if (!hasPermission)
    return <>{fallback}</>
  return <>{children}</>
}
