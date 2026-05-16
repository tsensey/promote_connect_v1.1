import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/context';
import { I18nProvider } from '@/lib/i18n';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
  colorScheme: 'light dark',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(manrope.variable)}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              <AuthProvider>
                <I18nProvider>
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
