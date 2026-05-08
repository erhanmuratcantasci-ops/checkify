import { MarketingBackground } from "@/components/marketing/MarketingBackground";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { LogoWall } from "@/components/marketing/LogoWall";
import { FeaturesGroup } from "@/components/marketing/FeaturesGroup";

export default function LandingPage() {
  return (
    <>
      <MarketingBackground />
      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-24 md:px-10">
        <MarketingHero />
        <LogoWall />
        <FeaturesGroup />
        {/* Sections coming next: Pricing · FAQ · CTA · Footer */}
      </main>
    </>
  );
}
