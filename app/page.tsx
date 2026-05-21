import { MarketingNavbar } from '@/components/landing/MarketingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { UsefulLinksSection } from '@/components/landing/UsefulLinksSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { MarketingFooter } from '@/components/landing/MarketingFooter';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  if (userAgent.includes('CapacitorApp')) {
    redirect('/login');
  }

  return (
    <>
      <MarketingNavbar />
      <HeroSection />
      {/* <StatsSection /> */}
      <FeaturesSection />
      <UsefulLinksSection />
      <CtaSection />
      <MarketingFooter />
    </>
  );
}
