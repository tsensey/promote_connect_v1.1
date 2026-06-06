import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/context';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotificationStateProvider } from '@/lib/notification-context';
import { NotificationProvider } from '@/components/shared/NotificationProvider';
import { PwaRegister } from '@/components/shared/PwaRegister';
import { CapacitorStatusBar } from '@/components/shared/CapacitorStatusBar';
import { CapacitorInitializer } from '@/components/shared/CapacitorInitializer';
import { AnimatedSplashScreen } from '@/components/shared/AnimatedSplashScreen';
import PlausibleAnalytics from '@/components/shared/PlausibleAnalytics';
import { cn } from '@/lib/utils';
import './globals.css';

// Police servie localement au build time — plus de requête réseau bloquante
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const viewport: Viewport = {
  themeColor: { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'PROMOTE-CONNECT',
    template: '%s | PROMOTE-CONNECT',
  },
  description: 'Plateforme digitale de networking pour salons professionnels PROMOTE',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PROMOTE-CONNECT',
    statusBarStyle: 'black-translucent',
  },


  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialLocale: Locale = 'fr';
  try {
    const cookieStore = await cookies();
    initialLocale = (cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'fr') as Locale;
  } catch {
    // Static export: cookies() is unavailable, default to 'fr'
  }

  return (
    <html
      lang={initialLocale}
      className={manrope.variable}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning className={cn('min-h-screen bg-background text-foreground', manrope.variable)}>
        {/* <AnimatedSplashScreen /> */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              <AuthProvider>
                <I18nProvider initialLocale={initialLocale}>
                  <NotificationStateProvider>
                    <NotificationProvider>
                      <Suspense fallback={null}>
                        {children}
                      </Suspense>
                      <Toaster richColors position="top-right" />
                      <PwaRegister />
                      <CapacitorStatusBar />
                      <CapacitorInitializer />
                      <PlausibleAnalytics />
                    </NotificationProvider>
                  </NotificationStateProvider>
                </I18nProvider>
              </AuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
