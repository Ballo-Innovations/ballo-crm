import { Brain, Gauge, Lightbulb, Repeat } from "lucide-react";

import { GradientText } from "./gradient-text";
import { SectionIntro } from "./section-intro";

const capabilities = [
  {
    icon: Gauge,
    title: "Opportunity qualification scoring",
    description:
      "Every opportunity gets a structured, explainable score so pipeline stages mean the same thing for every rep.",
  },
  {
    icon: Lightbulb,
    title: "Next-best-action",
    description:
      "Concrete recommendations on the account or deal - what to do next, surfaced where you already work.",
  },
  {
    icon: Brain,
    title: "Account & contact summaries",
    description:
      "Instant briefs synthesized from activity, contracts, and health - no scrolling through months of notes.",
  },
  {
    icon: Repeat,
    title: "Cross-sell & upsell signals",
    description:
      "Usage, health, and pipeline data read together to flag expansion opportunities before they're missed.",
  },
];

export function BrutusAiSection() {
  return (
    <section id="brutus-ai" className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 py-20 md:py-28">
        <SectionIntro
          showMark
          eyebrow="Powered by Brutus AI"
          title={
            <>
              Commercial intelligence <GradientText>built into the workflow</GradientText>
            </>
          }
          description="Brutus AI runs as asynchronous jobs across your commercial data, turning accounts, pipeline, and health signals into structured recommendations — the intelligence layer reps and managers actually use, because it lives where they already work."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card hover:border-brand/40 flex flex-col gap-3 rounded-xl border p-5 transition-colors"
            >
              <div className="from-brand/15 to-primary/10 text-primary ring-brand/20 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1">
                <Icon className="size-5" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
