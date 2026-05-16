import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Manrope } from 'next/font/google';
import { Suspense } from 'react';
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
import { cn } from '@/lib/utils';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
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
  const cookieStore = await cookies();
  const initialLocale = (cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'fr') as Locale;

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(manrope.variable)}
    >
      <body className="min-h-screen bg-background text-foreground">
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
