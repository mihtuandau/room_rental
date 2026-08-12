import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { SmsService } from './sms.service';

const twilioConfig = {
  NODE_ENV: 'development',
  SMS_PROVIDER: 'twilio_verify',
  TWILIO_ACCOUNT_SID: `AC${'1'.repeat(32)}`,
  TWILIO_AUTH_TOKEN: '2'.repeat(32),
  TWILIO_VERIFY_SERVICE_SID: `VA${'3'.repeat(32)}`,
};

function createService(values: Record<string, string>) {
  const config = {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];
      if (!value) throw new Error(`Missing ${key}`);
      return value;
    }),
  };
  return new SmsService(config as unknown as ConfigService);
}

describe('SmsService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends a custom OTP through Twilio Verify using E.164', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ status: 'pending' }),
    } as unknown as Response);
    const service = createService(twilioConfig);

    await service.sendVerification('0912345678', '654321');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://verify.twilio.com/v2/Services/${twilioConfig.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    );
    expect(options?.method).toBe('POST');
    expect((options?.body as URLSearchParams).toString()).toBe(
      'To=%2B84912345678&Channel=sms&CustomCode=654321',
    );
  });

  it('reports successful verification feedback to Twilio', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'approved' }),
    } as unknown as Response);
    const service = createService(twilioConfig);

    await service.confirmVerification('+84912345678', '654321');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://verify.twilio.com/v2/Services/${twilioConfig.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    );
    expect((options?.body as URLSearchParams).toString()).toBe(
      'To=%2B84912345678&Code=654321',
    );
  });

  it('keeps the mock transport local without contacting Twilio', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    const service = createService({
      NODE_ENV: 'development',
      SMS_PROVIDER: 'mock',
    });

    await service.sendVerification('0912345678', '123456');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a safe service error when Twilio rejects delivery', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ code: 60200 }),
    } as unknown as Response);
    const service = createService(twilioConfig);

    await expect(
      service.sendVerification('0912345678', '654321'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
