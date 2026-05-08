import { MarketingBackground } from "@/components/marketing/MarketingBackground";
import { MarketingHero } from "@/components/marketing/MarketingHero";

export default function LandingPage() {
  return (
    <>
      <MarketingBackground />
      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-24 md:px-10">
        <MarketingHero />
        {/* Sections coming next: LogoWall · Features · Pricing · FAQ · CTA · Footer */}
      </main>
    </>
  );
}
