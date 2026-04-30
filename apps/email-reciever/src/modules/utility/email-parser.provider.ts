import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailParser {
  sanitizeEmail(email: string) {
    return email.toLowerCase().replace(/[.@]/g, '_');
  }

  extractNetflixUrl(emailText: string) {
    const cleanText = emailText.replace(/[\u200C-\u200F]/g, '').trim();

    const linkMatch = cleanText.match(/https:\/\/www\.netflix\.com\/(?:password|account\/update-primary-location|account\/travel\/verify|verifyemail|YourAccount)[^\s>\]]*/);
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
}
