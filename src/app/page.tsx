import type { Metadata } from "next";

import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { GradingSection } from "@/components/marketing/grading-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { ModulesSection } from "@/components/marketing/modules-section";
import { PersonasSection } from "@/components/marketing/personas-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} - ${siteConfig.tagline}` },
  description: siteConfig.description,
};

/** Marketing page in the app's own look: white shell, grey rounded panels, white cards. */
export default function Home() {
  return (
    <div className="bg-shell text-ink flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-2 md:gap-4 md:px-4">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <GradingSection />
        <ModulesSection />
        <PersonasSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
