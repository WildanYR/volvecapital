import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions on a route.
 * Only applies to DASHBOARD_USER role. TENANT_OWNER bypasses all checks.
 *
 * @example
 * @RequirePermissions('product.create', 'product.edit')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
