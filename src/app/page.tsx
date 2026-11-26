import type { Metadata } from "next";

import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { RolesSection } from "@/components/marketing/roles-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} - ${siteConfig.tagline}` },
  description: siteConfig.description,
};

/**
 * Landing page, option A "Product stage" with gradient waves
 * (docs/03-design/01-design-system.md "Landing page").
 */
export default function Home() {
  return (
    <div className="bg-shell text-ink flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex w-full flex-col">
        <HeroSection />
        <StatsStrip />
        <FeaturesSection />
        <RolesSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
