'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useAnalytics } from '@/lib/analytics/plausible';

export function WebVitals() {
  const { trackEvent } = useAnalytics();

  useReportWebVitals((metric) => {
    // Les Core Web Vitals importants
    if (['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) {
      trackEvent('web_vitals' as any, {
        props: {
          metric: metric.name,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
        },
      } as any);
    }
  });

  return null;
}
