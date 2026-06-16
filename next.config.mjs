import { withSentryConfig } from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

// ── F016 Remediation ──────────────────────────────────────────────────────────
// BEFORE: script-src included 'unsafe-inline' (still needed for Next.js inline styles/scripts)
// BEFORE: connect-src used https://*.supabase.co which allowed exfiltration to attacker-owned Supabase projects
// AFTER:  connect-src pinned to https://api.promote-connect.pro (the actual Supabase endpoint)
// BEFORE: worker-src included blob: which allowed persistent ServiceWorker registration post-XSS
// AFTER:  worker-src 'self' only (sw.js does not use blob: URLs)
// ──────────────────────────────────────────────────────────────────────────────

const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  !isProduction ? "'unsafe-eval'" : null,
  'https://js.stripe.com',
  !isProduction ? 'https://vercel.live' : null,
  'https://plausible.io',
].filter(Boolean).join(' ');

const connectSrc = [
  "connect-src 'self'",
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
      "img-src 'self' data: blob: https://api.promote-connect.pro https://*.stripe.com",
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "bbit-sarl",

  project: "promote-connect",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
