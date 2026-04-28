import { registerAs } from '@nestjs/config';

export const DokuConfig = registerAs('doku', () => ({
  clientId: process.env.DOKU_CLIENT_ID,
  secretKey: process.env.DOKU_SECRET_KEY,
  isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
  notifyUrl: process.env.DOKU_NOTIFY_URL,
}));
