import { MarketingNavbar } from '@/components/landing/MarketingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { UsefulLinksSection } from '@/components/landing/UsefulLinksSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { MarketingFooter } from '@/components/landing/MarketingFooter';
import { NativeAuthGuard } from '@/components/shared/NativeAuthGuard';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

export default async function LandingPage() {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    if (userAgent.includes('CapacitorApp')) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect('/login');
      }
      redirect('/feed');
    }
  } catch {
    // Static export (Capacitor build): redirection gérée côté client
    return <NativeAuthGuard />;
  }

  return (
    <>
      <MarketingNavbar />
      <HeroSection />
      <FeaturesSection />
      <UsefulLinksSection />
      <CtaSection />
      <MarketingFooter />
    </>
  );
}
