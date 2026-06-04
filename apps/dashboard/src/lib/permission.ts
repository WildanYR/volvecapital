import { useAuth } from '@/dashboard/context-providers/auth.provider'

/**
 * Check if current user has a specific permission.
 * TENANT_OWNER always returns true (bypass).
 */
export function usePermission(permission: string): boolean {
  const auth = useAuth()
  if (!auth.tenant)
    return false
  if (!auth.tenant.role || auth.tenant.role === 'TENANT_OWNER')
    return true
  
  const perms = permission.split(',').map(p => p.trim())
  return perms.some(p => auth.tenant!.permissions?.includes(p))
}

/**
 * Check if current user has ALL of the specified permissions.
 * TENANT_OWNER always returns true.
 */
export function useAllPermissions(permissions: string[]): boolean {
  const auth = useAuth()
  if (!auth.tenant)
    return false
  if (!auth.tenant.role || auth.tenant.role === 'TENANT_OWNER')
    return true
  const userPerms = auth.tenant.permissions ?? []
  return permissions.every(p => userPerms.includes(p))
}

/**
 * Non-hook version: check permission from tenant object directly.
 */
export function can(
  permission: string,
  tenant: { role?: string, permissions?: string[] } | null,
): boolean {
  if (!tenant)
    return false
  if (!tenant.role || tenant.role === 'TENANT_OWNER')
    return true
  
  const perms = permission.split(',').map(p => p.trim())
  return perms.some(p => tenant.permissions?.includes(p))
}
