import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

const RECOMMENDED = [
  'STRIPE_PRICE_ID_ANNUAL',
  'RESEND_FROM_NAME',
  'FCM_SERVER_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_PLAUSIBLE_URL',
  'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
  'NEXT_PUBLIC_ANDROID_PACKAGE_NAME',
  'NEXT_PUBLIC_IOS_TEAM_ID',
  'NEXT_PUBLIC_IOS_APP_STORE_ID',
];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

const missingRequired = REQUIRED.filter((key) => isBlank(process.env[key]));
const missingRecommended = RECOMMENDED.filter((key) => isBlank(process.env[key]));

if (missingRequired.length > 0) {
  console.error('Missing required production environment variables:');
  for (const key of missingRequired) console.error(`- ${key}`);
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn('Missing recommended production environment variables:');
  for (const key of missingRecommended) console.warn(`- ${key}`);
}

console.log('Production environment check passed.');
