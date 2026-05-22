import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailParser {
  sanitizeEmail(email: string) {
    return email.toLowerCase().replace(/[.@]/g, '_');
  }

  extractNetflixResetLink(emailText: string) {
    const cleanText = emailText.replace(/[\u200C-\u200F]/g, '').trim();

    // Mencari link netflix apa saja (password, restart, login, dll)
    const linkMatch = cleanText.match(/https:\/\/www\.netflix\.com\/[^\s>\]]+/);
    const resetLink = linkMatch ? linkMatch[0] : null;

    return resetLink;
  }

  extractNetflixOtp(emailText: string) {
    const cleanText = emailText.replace(/[\u200C-\u200F]/g, '').trim();

    const otpRegex = /^\s*(\d{4,6})\s*$/m;

    const otpMatch = cleanText.match(otpRegex);
    const otpCode = otpMatch ? otpMatch[1] : null;

    return otpCode;
  }

  extractDisneyOtp(emailText: string) {
    const cleanText = emailText.replace(/[\u200C-\u200F]/g, '').trim();

    // Ekstrak angka 4 hingga 6 digit pertama yang ada di dalam text
    // Karena plain-body Disney kadang menyatu dengan teks lain
    const otpMatch = cleanText.match(/\b(\d{4,6})\b/);
    const otpCode = otpMatch ? otpMatch[1] : null;

    return otpCode;
  }
}
