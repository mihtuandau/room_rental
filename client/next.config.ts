import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files actually needed to run, so the
  // production image doesn't have to carry node_modules.
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // seed data uses placeholder images; drop this once real listings exist
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
