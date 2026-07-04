import { Activity, Database, MessageSquareShare, Sparkles, Target, TrendingUp } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { GradientText } from "./gradient-text";
import { SectionIntro } from "./section-intro";

const features = [
  {
    icon: Database,
    title: "Single source of truth",
    description:
      "Accounts, contacts, pipelines, and contracts live in one system instead of a dozen spreadsheets that never agree. Everyone works from the same numbers.",
  },
  {
    icon: Activity,
    title: "Account health signals",
    description:
      "Delivery status, payment reliability, and activity recency flow from BalloAds into every account view - churn risk surfaces on a dashboard, not in a hallway conversation.",
  },
  {
    icon: Target,
    title: "Structured qualification",
    description:
      "Promote deals through the pipeline on BANT/MEDDIC-style criteria, not gut feel. Forecasts become defensible instead of a spreadsheet built the night before the board meeting.",
  },
  {
    icon: MessageSquareShare,
    title: "Native BalloAds messaging",
    description:
      "Trigger onboarding sequences and renewal nudges without leaving the CRM. Every touchpoint calls BalloAds directly and logs back as a CRM activity - no second tool to operate.",
  },
  {
    icon: Sparkles,
    title: "Brutus AI intelligence",
    description:
      "Qualification scoring, next-best-action, summarization, and cross-sell/upsell detection run as background AI jobs - structured recommendations where you already work.",
  },
  {
    icon: TrendingUp,
    title: "Commercial analytics",
    description:
      "Pipeline velocity, win rate, forecast, and account-health distribution by vertical - roll-up reporting without waiting on a manually assembled export.",
  },
];

export function FeaturesSection() {
  return (
    <section id="platform" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <SectionIntro
          align="left"
          eyebrow="The platform"
          title={
            <>
              Everything commercial teams need, <GradientText>in one system</GradientText>
            </>
          }
          description="Generic CRMs take months to configure for a B2B commercial workflow — and none of them talk natively to your messaging platform. BalloCRM is built for it from the ground up."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="hover:border-brand/40 hover:shadow-brand/5 transition-all hover:shadow-lg"
            >
              <CardHeader>
                <div className="from-brand/15 to-primary/10 text-primary ring-brand/20 mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-pretty">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
