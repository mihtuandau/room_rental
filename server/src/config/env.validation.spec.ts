import { validateEnv } from './env.validation';

const validEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost/test',
  JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
  JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
  FRONTEND_URL: 'http://localhost:5000',
  REDIS_URL: 'redis://localhost:6379',
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'public-key',
  CLOUDINARY_API_SECRET: 'private-secret',
  GOOGLE_CLIENT_ID: 'google-client-id',
};

describe('validateEnv', () => {
  it('rejects deployments that reuse one secret for both JWT types', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        JWT_REFRESH_SECRET: validEnv.JWT_ACCESS_SECRET,
      }),
    ).toThrow('JWT access and refresh secrets must be different.');
  });
});
