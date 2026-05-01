/**
 * Netflix Reset Password Utils
 */

/**
 * Sanitize email by replacing @ and . with _
 * Used for creating consistent browser context names and event names
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/[.@]/g, '_');
}
