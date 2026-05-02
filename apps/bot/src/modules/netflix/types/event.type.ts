/**
 * Netflix Reset Password Event Data
 */

export interface ResetPasswordEventData {
  from: string;
  date: string;
  subject: string;
  data: string;  // Contains the reset password link
}
