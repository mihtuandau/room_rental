import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('SmsService: no SMS provider configured for production.');
    }
    // Never log the raw OTP. In local development, use DEV_OTP_CODE so the
    // developer already knows which code to enter in the UI.
    void message;
    this.logger.warn(
      `[DEV ONLY] SMS transport skipped for ${phone}. Use DEV_OTP_CODE to verify the code.`,
    );
    await Promise.resolve();
  }
}
