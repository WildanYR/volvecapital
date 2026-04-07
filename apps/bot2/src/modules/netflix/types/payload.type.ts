/**
 * Netflix Reset Password Task Payload
 */

export interface ResetPasswordPayload {
  id: string;              // Payload identifier, not account id
  email: string;
  password?: string;     // Old password (for change password flow)
  newPassword: string;   // New password
  accountId: string;     // Account.id used for PATCH /account/:id
}
