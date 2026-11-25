import { BarChart3, Building2, FileText, Megaphone, Target, Users } from "lucide-react";

import { GradientText } from "./gradient-text";
import { SectionIntro } from "./section-intro";

const modules = [
  {
    icon: Building2,
    title: "Enterprise accounts",
    description: "Ownership, hierarchy, health, and lifecycle stage for every customer.",
  },
  {
    icon: Users,
    title: "Contacts",
    description: "The people behind every account, with full communication history.",
  },
  {
    icon: Target,
    title: "Opportunities",
    description: "Qualified pipeline with stage gating and AI-assisted scoring.",
  },
  {
    icon: FileText,
    title: "Contracts",
    description: "Terms, values, and renewal dates that never drift out of date.",
  },
  {
    icon: Megaphone,
    title: "Campaigns",
    description: "Account-based outreach delivered through BalloAds, logged as activity.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Forecast, velocity, and health distribution by vertical and rep.",
  },
];

export function ModulesSection() {
  return (
    <section id="modules" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <SectionIntro
          align="left"
          eyebrow="Modules"
          title={
            <>
              The full commercial workflow, <GradientText>module by module</GradientText>
            </>
          }
          description="One data model, one navigation, one login. Each module shares the same accounts, contacts, and activity feed, so nothing has to be re-entered or reconciled."
        />

        <div className="mt-12 grid divide-y overflow-hidden rounded-xl border sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="group bg-background hover:bg-brand/5 flex flex-col gap-3 p-6 transition-colors"
              // ensure clean grid borders across breakpoints
              data-index={i}
            >
              <div className="flex items-center gap-3">
                <div className="from-brand/15 to-primary/10 text-primary ring-brand/20 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1 transition-transform group-hover:scale-105">
                  <Icon className="size-4.5" />
                </div>
                <h3 className="font-medium">{title}</h3>
              </div>
              <p className="text-muted-foreground text-sm text-pretty">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
