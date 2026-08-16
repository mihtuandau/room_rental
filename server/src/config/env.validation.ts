import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'staging', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('20m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    FRONTEND_URL: z.string().url(),
    REDIS_URL: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    // The preset must enforce the same 5 MB / image-format limits in
    // Cloudinary before bytes are accepted, not only after confirmation.
    CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
    // Only the client id is needed: we verify Google ID tokens sent by the
    // frontend, we never run the redirect flow that would require the secret.
    GOOGLE_CLIENT_ID: z.string().min(1),
    FACEBOOK_APP_ID: z.string().min(1),
    FACEBOOK_APP_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    MAIL_HOST: z.string().min(1).optional(),
    MAIL_PORT: z.coerce.number().int().positive().optional(),
    MAIL_USER: z.string().email().optional(),
    MAIL_PASSWORD: z.string().min(1).optional(),
    MAIL_FROM: z.string().email().optional(),
    MAIL_FROM_NAME: z.string().min(1).optional(),
    SMS_PROVIDER: z.enum(['mock', 'twilio_verify']).default('mock'),
    TWILIO_ACCOUNT_SID: z
      .string()
      .regex(/^AC[0-9a-fA-F]{32}$/)
      .optional(),
    TWILIO_AUTH_TOKEN: z
      .string()
      .regex(/^[0-9a-fA-F]{32}$/)
      .optional(),
    TWILIO_VERIFY_SERVICE_SID: z
      .string()
      .regex(/^VA[0-9a-fA-F]{32}$/)
      .optional(),
    // Development-only deterministic OTP for the mock SMS transport.
    DEV_OTP_CODE: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: 'JWT access and refresh secrets must be different.',
    path: ['JWT_REFRESH_SECRET'],
  })
  .refine((env) => env.NODE_ENV !== 'production' || !env.DEV_OTP_CODE, {
    message: 'DEV_OTP_CODE must not be configured in production.',
    path: ['DEV_OTP_CODE'],
  })
  .refine(
    (env) =>
      env.NODE_ENV !== 'production' || Boolean(env.CLOUDINARY_UPLOAD_PRESET),
    {
      message: 'CLOUDINARY_UPLOAD_PRESET is required in production.',
      path: ['CLOUDINARY_UPLOAD_PRESET'],
    },
  )
  .superRefine((env, ctx) => {
    if (env.SMS_PROVIDER !== 'twilio_verify') {
      if (env.NODE_ENV === 'production') {
        ctx.addIssue({
          code: 'custom',
          message: 'SMS_PROVIDER must be twilio_verify in production.',
          path: ['SMS_PROVIDER'],
        });
      }
      return;
    }

    const requiredTwilioValues = [
      ['TWILIO_ACCOUNT_SID', env.TWILIO_ACCOUNT_SID],
      ['TWILIO_AUTH_TOKEN', env.TWILIO_AUTH_TOKEN],
      ['TWILIO_VERIFY_SERVICE_SID', env.TWILIO_VERIFY_SERVICE_SID],
    ] as const;
    for (const [key, value] of requiredTwilioValues) {
      if (!value) {
        ctx.addIssue({
          code: 'custom',
          message: `${key} is required when SMS_PROVIDER=twilio_verify.`,
          path: [key],
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${result.error.toString()}`,
    );
  }
  return result.data;
}
