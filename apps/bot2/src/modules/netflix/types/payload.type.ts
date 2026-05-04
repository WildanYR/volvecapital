/**
 * Netflix Reset Password Task Payload
 */

export interface ResetPasswordPayload {
  id: string;              // Payload identifier, not account id
  email: string;
  password?: string;     // Old password (for change password flow)
  newPassword: string;   // New password
  accountId: string;     // Account.id used for PATCH /account/:id
  subscription_expiry: string;
  variant_name: string;
}

/**
 * Netflix Auto Reload Task Payload
 */
export interface AutoReloadPayload {
  accountId: string;    // Account.id untuk update DB setelah selesai
  email: string;        // Email akun Netflix
  password: string;     // Password akun (untuk login jika diperlukan)
  billing: string;      // Metode bayar (GoPay, ShopeePay, dll) — ditampilkan ke admin
  variant_name: string; // Nama varian — menentukan plan yang dipilih
}
