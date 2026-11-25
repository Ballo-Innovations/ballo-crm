import { Check, Minus } from "lucide-react";

import { GradeBadge } from "@/components/shared/pills";

import { Panel, SectionIntro } from "./section-intro";

// The worked example from docs/01-product/02-scoring-and-grading-spec.md.
const factors: { label: string; value: string; up: boolean }[] = [
  { label: "Stage: Negotiate", value: "0.75", up: true },
  { label: "Committee coverage 70% (no technical buyer)", value: "× 0.88", up: false },
  { label: "Engagement 60/100 (DC tour, 2 demos)", value: "× 0.88", up: true },
  { label: "Last activity 3 days ago", value: "× 1.00", up: true },
  { label: "Budget confirmed, no competitor", value: "× 1.00", up: true },
];

const steps = [
  {
    title: "Scored from real activity",
    description:
      "Stage, buying committee coverage, engagement, recency, deal size, account health, competition and budget.",
  },
  {
    title: "Graded the same way for everyone",
    description:
      "Bronze, Silver, Gold or Platinum, with clear rules for each, so a Gold deal means the same thing on every team.",
  },
  {
    title: "Told what to do next",
    description:
      "Each grade comes with next best actions, like adding a technical stakeholder or confirming the budget owner.",
  },
];

export function GradingSection() {
  return (
    <Panel id="grading" className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
      <div className="flex flex-col gap-8">
        <SectionIntro
          eyebrow="Grading"
          title="Every number explains itself"
          description="No black boxes. Open any deal and see exactly why it scored what it did, and what would move it up."
        />
        <ol className="flex flex-col gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="bg-card grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <span>
                <span className="block text-[17px] font-semibold">{s.title}</span>
                <span className="text-mute block text-[15px] text-pretty">{s.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-card rounded-card p-[18px] md:p-[26px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold md:text-[22px]">
              Kariba Power Co. - Fibre backbone
            </p>
            <p className="text-mute text-[13px]">Opportunity · Negotiate · K6,400,000</p>
          </div>
          <GradeBadge grade="GOLD" score={58} />
        </div>

        <div className="mt-6 flex items-center gap-5">
          <ScoreRing score={58} />
          <div className="text-[15px]">
            <p className="font-semibold">Score 58 of 100</p>
            <p className="text-mute text-[13px]">Gold needs 55 or more and a named champion.</p>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-2">
          {factors.map((f) => (
            <li key={f.label} className="bg-soft rounded-row flex items-center gap-3 px-3.5 py-3">
              <span className="bg-card grid size-7 shrink-0 place-items-center rounded-full">
                {f.up ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1 text-sm">{f.label}</span>
              <span className="text-sm font-semibold tabular-nums">{f.value}</span>
            </li>
          ))}
        </ul>

        <div className="border-line mt-5 border-t pt-4">
          <p className="text-mute text-xs font-semibold">Next best actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Add a technical stakeholder", "Confirm budget owner"].map((a) => (
              <span key={a} className="bg-soft rounded-full px-3 py-[5px] text-xs">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="size-[72px] shrink-0 -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-soft" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        className="stroke-ink"
      />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink rotate-90 text-[18px] font-bold"
        style={{ transformOrigin: "36px 36px" }}
      >
        {score}
      </text>
    </svg>
  );
}
