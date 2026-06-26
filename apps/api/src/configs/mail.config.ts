import { registerAs } from '@nestjs/config';

export const MailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: Number.parseInt(process.env.MAIL_PORT || '2525', 10),
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_FROM,
}));
