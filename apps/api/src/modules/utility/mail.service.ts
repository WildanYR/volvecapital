import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getTransporter() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!host || !user || !pass) {
      this.logger.error('Mail configuration missing');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  async sendMail({
    to,
    subject,
    html,
    fromName = 'Digital Premium',
  }: {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const from = this.configService.get<string>('mail.from');

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
