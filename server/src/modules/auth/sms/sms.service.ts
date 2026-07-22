import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(phone: string, message: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SmsService: no SMS provider configured for production.');
    }
    // dev-only: never log the raw OTP code in production (HARD RULE #2)
    this.logger.warn(`[DEV ONLY] SMS to ${phone}: ${message}`);
    await Promise.resolve();
  }
}
