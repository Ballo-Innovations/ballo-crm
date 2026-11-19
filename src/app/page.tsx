import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { ShowcaseSection } from "@/components/marketing/showcase-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { ModulesSection } from "@/components/marketing/modules-section";
import { BrutusAiSection } from "@/components/marketing/brutus-ai-section";
import { PersonasSection } from "@/components/marketing/personas-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { PageBackdrop } from "@/components/marketing/page-backdrop";

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
