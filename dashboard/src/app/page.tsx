import { MarketingBackground } from "@/components/marketing/MarketingBackground";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { LogoWall } from "@/components/marketing/LogoWall";
import { FeaturesGroup } from "@/components/marketing/FeaturesGroup";
import { MarketingPricing } from "@/components/marketing/MarketingPricing";
import { MarketingFAQ } from "@/components/marketing/MarketingFAQ";
import { MarketingCTA } from "@/components/marketing/MarketingCTA";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <>
      <MarketingBackground />
      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-12 md:px-10">
        <MarketingHero />
        <LogoWall />
        <FeaturesGroup />
        <MarketingPricing />
        <MarketingFAQ />
        <MarketingCTA />
        <MarketingFooter />
      </main>
    </>
  );
}
