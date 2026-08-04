import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, text: string) {
    const mailHost = this.config.get<string>('MAIL_HOST');
    const mailUser = this.config.get<string>('MAIL_USER');
    const mailPassword = this.config.get<string>('MAIL_PASSWORD');
    const mailFrom = this.config.get<string>('MAIL_FROM') ?? mailUser;

    if (mailHost && mailUser && mailPassword && mailFrom) {
      const port = Number(this.config.get<string>('MAIL_PORT') ?? 465);
      const transport = nodemailer.createTransport({
        host: mailHost,
        port,
        secure: port === 465,
        auth: { user: mailUser, pass: mailPassword },
        connectionTimeout: 10_000,
      });
      await transport.sendMail({
        from: `${this.config.get<string>('MAIL_FROM_NAME') ?? 'Trọ Ơi'} <${mailFrom}>`,
        to,
        subject,
        text,
      });
      return;
    }

    // Keep Resend as a backwards-compatible fallback for deployments that
    // have not migrated to SMTP yet.
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const resendFrom = this.config.get<string>('EMAIL_FROM');
    if (apiKey && resendFrom) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: resendFrom, to: [to], subject, text }),
      });
      if (!response.ok) {
        const providerMessage = await response.text().catch(() => '');
        this.logger.error(
          `Email provider rejected delivery (status ${response.status}): ${providerMessage.slice(0, 300)}`,
        );
        throw new Error('Email delivery failed.');
      }
      return;
    }

    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('EmailService is not configured for production.');
    }
    this.logger.warn(`[DEV ONLY] Email to ${to}: ${text}`);
  }
}
