import {
  BarChart3,
  Database,
  FileSignature,
  Gauge,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Panel, SectionIntro } from "./section-intro";

const features: { icon: LucideIcon; title: string; description: string; highlight?: boolean }[] = [
  {
    icon: Database,
    title: "One customer view",
    description:
      "Accounts, contacts, services, contracts and every touchpoint on one timeline. Everyone works from the same numbers.",
  },
  {
    icon: Gauge,
    title: "Explainable deal grades",
    description:
      "Every opportunity gets a 0-100 score and a Bronze to Platinum grade, with the factors behind it one click away.",
    highlight: true,
  },
  {
    icon: BarChart3,
    title: "Vertical Sales Index",
    description:
      "Revenue ranked by sector with growth trends, so leadership sees where the business is really moving.",
  },
  {
    icon: Lightbulb,
    title: "Cross-sell recommendations",
    description:
      "Rules read what each account already buys and how it engages, then suggest the next service with the reason spelled out.",
  },
  {
    icon: FileSignature,
    title: "Contracts that close",
    description:
      "Generate a contract from a won deal, send it for e-signature and see renewals coming months ahead.",
  },
  {
    icon: ShieldCheck,
    title: "Roles and a full audit trail",
    description:
      "Each role sees what it needs, and every change is logged with who made it and when.",
  },
];

export function FeaturesSection() {
  return (
    <Panel id="platform">
      <SectionIntro
        eyebrow="The platform"
        title="Everything a commercial team needs, in one system"
        description="Built for B2B selling: long deals, buying committees, many services per account and contracts that renew."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 md:gap-4 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description, highlight }) => (
          <div
            key={title}
            className="bg-card rounded-card ease-ballo flex flex-col gap-3 p-[22px] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_24px_rgb(0_0_0/0.07)] md:p-[26px]"
          >
            <span
              className={cn(
                "grid size-[46px] place-items-center rounded-full",
                highlight ? "bg-ink text-shell" : "bg-soft",
              )}
            >
              <Icon className="size-[18px]" />
            </span>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-mute text-[15px] text-pretty">{description}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
