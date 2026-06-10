

const isProduction = process.env.NODE_ENV === 'production';

const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  !isProduction ? "'unsafe-eval'" : null,
  'https://js.stripe.com',
  !isProduction ? 'https://vercel.live' : null,
  'https://plausible.io',
].filter(Boolean).join(' ');

const connectSrc = [
  "connect-src 'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://api.promote-connect.pro',
  'wss://api.promote-connect.pro',
  'https://api.stripe.com',
  'https://*.resend.com',
  'https://*.sentry.io',
  'https://*.ingest.sentry.io',
  'https://plausible.io',
  !isProduction ? 'https://vercel.live' : null,
].filter(Boolean).join(' ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "frame-src 'self' https://js.stripe.com https://www.youtube.com https://player.vimeo.com",
      connectSrc,
      "worker-src 'self' blob:",
      "img-src 'self' data: blob: https://*.supabase.co https://api.promote-connect.pro https://*.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Active la compression GZIP/Brotli
  ...(isCapacitorBuild ? { output: 'export', distDir: 'out', typescript: { ignoreBuildErrors: true } } : {}),
  transpilePackages: ['@base-ui/react'],
  poweredByHeader: false,
  // Supprimer console.log en production (sauf console.error/warn)
  compiler: {
    removeConsole: isProduction ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    unoptimized: isCapacitorBuild,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.promote-connect.pro' },
      { protocol: 'https', hostname: '*.stripe.com' },
    ],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // Assets Next.js immutables (hash dans le nom) — cache 1 an
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Images publiques — cache 7 jours avec revalidation
      {
        source: '/:path*.{png,jpg,jpeg,gif,webp,svg,ico}',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
            ],
      },
      // Polices — cache 1 an
      {
        source: '/:path*.{woff,woff2,ttf,otf}',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
