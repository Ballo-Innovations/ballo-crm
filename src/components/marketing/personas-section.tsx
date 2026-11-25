import { EntityAvatar } from "@/components/shared/entity-avatar";

import { Panel, SectionIntro } from "./section-intro";

const personas = [
  {
    role: "Account managers",
    outcome:
      "See every account's services, contracts, contacts and touchpoints in one place, and know which renewals are coming.",
  },
  {
    role: "Sales reps",
    outcome:
      "Move deals on a drag-and-drop pipeline and get a short list of the deals to work today, with the reason for each.",
  },
  {
    role: "Sales managers",
    outcome:
      "Trust the forecast. Weighted pipeline, win rate and grades by rep and sector, without building a spreadsheet.",
  },
  {
    role: "Marketing",
    outcome:
      "Run account-based plans on strategic accounts and see which tours, demos and events move deals forward.",
  },
  {
    role: "Legal",
    outcome: "Draft contracts from templates, track signatures and keep every version on record.",
  },
  {
    role: "Executives",
    outcome:
      "The whole commercial picture at a glance: revenue by sector, at-risk deals and the insights that matter this week.",
  },
];

export function PersonasSection() {
  return (
    <Panel id="personas">
      <SectionIntro
        eyebrow="Who it's for"
        title="Built for everyone who owns a customer relationship"
        description="Each role gets its own view of the same connected data."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 md:gap-4 lg:grid-cols-3">
        {personas.map((p) => (
          <div key={p.role} className="bg-card rounded-card flex flex-col gap-3 p-[22px]">
            <div className="flex items-center gap-3">
              <EntityAvatar name={p.role} />
              <h3 className="text-lg font-semibold">{p.role}</h3>
            </div>
            <p className="text-mute text-[15px] text-pretty">{p.outcome}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
