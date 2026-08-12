import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TwilioVerifyResponse = {
  code?: number;
  status?: string;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  usesTwilioVerify(): boolean {
    return this.config.get<string>('SMS_PROVIDER') === 'twilio_verify';
  }

  async sendVerification(phone: string, code: string): Promise<void> {
    if (!this.usesTwilioVerify()) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException(
          'Phone verification is not configured.',
        );
      }
      // Never log the raw OTP. DEV_OTP_CODE gives local developers a known
      // value without exposing generated codes in application logs.
      this.logger.warn(
        `[DEV ONLY] SMS transport skipped for ${this.maskPhone(phone)}. Use DEV_OTP_CODE to verify the code.`,
      );
      return;
    }

    const response = await this.request('Verifications', {
      To: this.toE164(phone),
      Channel: 'sms',
      CustomCode: code,
    });
    if (response.status !== 'pending') {
      this.logger.error(
        `Twilio Verify returned an unexpected start status: ${response.status ?? 'missing'}.`,
      );
      throw new ServiceUnavailableException(
        'Unable to send verification code. Please try again.',
      );
    }
  }

  async confirmVerification(phone: string, code: string): Promise<void> {
    if (!this.usesTwilioVerify()) return;

    const response = await this.request('VerificationCheck', {
      To: this.toE164(phone),
      Code: code,
    });
    if (response.status !== 'approved') {
      this.logger.error(
        `Twilio Verify returned an unexpected check status: ${response.status ?? 'missing'}.`,
      );
      throw new ServiceUnavailableException(
        'Unable to confirm verification code. Please request a new code.',
      );
    }
  }

  private async request(
    resource: 'Verifications' | 'VerificationCheck',
    fields: Record<string, string>,
  ): Promise<TwilioVerifyResponse> {
    const accountSid = this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    const serviceSid = this.config.getOrThrow<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );
    const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/${resource}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      this.logger.error('Twilio Verify request could not reach the provider.');
      throw new ServiceUnavailableException(
        'Verification service is temporarily unavailable.',
      );
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as TwilioVerifyResponse;
    if (!response.ok) {
      this.logger.error(
        `Twilio Verify request failed (HTTP ${response.status}, code ${payload.code ?? 'unknown'}).`,
      );
      throw new ServiceUnavailableException(
        'Unable to process phone verification. Please try again.',
      );
    }
    return payload;
  }

  private toE164(phone: string): string {
    const normalized = phone.replace(/[\s.-]/g, '');
    return normalized.startsWith('0')
      ? `+84${normalized.slice(1)}`
      : normalized;
  }

  private maskPhone(phone: string): string {
    return phone.length > 4
      ? `${phone.slice(0, 3)}***${phone.slice(-3)}`
      : '***';
  }
}
