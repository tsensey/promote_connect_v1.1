import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/context';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});



export const metadata: Metadata = {
  title: {
    default: 'PROMOTE-CONNECT',
    template: '%s | PROMOTE-CONNECT',
  },
  description: 'Plateforme digitale de networking pour salons professionnels PROMOTE'
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
          <TooltipProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
