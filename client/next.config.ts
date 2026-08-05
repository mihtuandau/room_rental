import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files actually needed to run, so the
  // production image doesn't have to carry node_modules.
  output: 'standalone',
  poweredByHeader: false,

  async headers() {
    const securityHeaders = [
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      ...(isProduction
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
          ]
        : []),
    ];

    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  images: {
    qualities: [60, 75, 90],
    localPatterns: [{ pathname: '/**' }],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google OAuth avatars are served from this exact hostname.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // seed data uses placeholder images; drop this once real listings exist
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
