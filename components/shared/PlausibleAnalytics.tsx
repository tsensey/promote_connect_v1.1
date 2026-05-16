import Script from 'next/script';

const PLAUSIBLE_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_URL || 'https://plausible.io';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function PlausibleAnalytics() {
  if (!PLAUSIBLE_DOMAIN) return null;

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src={`${PLAUSIBLE_URL}/js/script.js`}
      strategy="afterInteractive"
    />
  );
}
