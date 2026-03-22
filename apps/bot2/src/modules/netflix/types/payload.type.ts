/**
 * Netflix Reset Password Task Payload
 */

export interface ResetPasswordPayload {
  id: string;
  email: string;
  password?: string;     // Old password (for change password flow)
  newPassword: string;   // New password
  accountId: string;
}
