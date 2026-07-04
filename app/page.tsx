import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { HeroSection } from "@/features/marketing/components/hero-section";
import { ShowcaseSection } from "@/features/marketing/components/showcase-section";
import { ProblemSection } from "@/features/marketing/components/problem-section";
import { FeaturesSection } from "@/features/marketing/components/features-section";
import { ModulesSection } from "@/features/marketing/components/modules-section";
import { BrutusAiSection } from "@/features/marketing/components/brutus-ai-section";
import { PersonasSection } from "@/features/marketing/components/personas-section";
import { CtaSection } from "@/features/marketing/components/cta-section";
import { PageBackdrop } from "@/features/marketing/components/page-backdrop";

export const metadata: Metadata = {
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <PageBackdrop />
        <main className="flex flex-col">
          <HeroSection />
          <ShowcaseSection />
          <ProblemSection />
          <FeaturesSection />
          <ModulesSection />
          <BrutusAiSection />
          <PersonasSection />
          <CtaSection />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
