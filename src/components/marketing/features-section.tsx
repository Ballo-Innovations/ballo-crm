import {
  CalendarDays,
  Database,
  Gauge,
  LineChart,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { SectionIntro } from "./section-intro";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Database,
    title: "One record per customer",
    description:
      "Accounts, contacts, deals, contracts and engagement in one place. No more reconciling five spreadsheets before a meeting.",
  },
  {
    icon: Gauge,
    title: "Grades you can explain",
    description:
      "Every deal is scored on stage, buying committee and engagement, and graded Bronze to Platinum. Open the score to see why.",
  },
  {
    icon: LineChart,
    title: "A forecast you can defend",
    description:
      "Weighted pipeline by vertical and rep, with the Vertical Sales Index showing where growth really comes from.",
  },
  {
    icon: Sparkles,
    title: "Brutus, grounded in your data",
    description:
      "Next best actions and cross-sell picks come from rules first. Brutus only words them, and never invents a number.",
  },
  {
    icon: CalendarDays,
    title: "Engagement that logs itself",
    description:
      "Touchpoints sent through BalloAds land on the account timeline, so health reflects what actually happened.",
  },
  {
    icon: ShieldCheck,
    title: "Audited by default",
    description:
      "Roles decide who sees what. Every change to a deal, score or contract is recorded with who and when.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-[1180px] scroll-mt-24 px-2 py-16 md:px-4 md:py-24"
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionIntro
          eyebrow="The platform"
          title={
            <>
              Built for B2B, <span className="text-mute block">not bent into it.</span>
            </>
          }
        />
        <p className="text-mute max-w-[460px] text-[17px] text-pretty md:text-lg">
          Generic CRMs take months to fit an enterprise sales motion. BalloCRM starts there.
        </p>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 md:mt-12 md:gap-4 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="bg-main rounded-card ease-ballo flex flex-col gap-3.5 p-[22px] transition-transform duration-200 hover:-translate-y-[3px] md:p-7"
          >
            <span className="bg-card grid size-10 place-items-center rounded-full">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-mute text-[15px] text-pretty">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
