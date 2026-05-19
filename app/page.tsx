import { MarketingNavbar } from '@/components/landing/MarketingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { UsefulLinksSection } from '@/components/landing/UsefulLinksSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

export default function LandingPage() {
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
