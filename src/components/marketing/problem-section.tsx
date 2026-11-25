import { X } from "lucide-react";

import { Panel, SectionIntro } from "./section-intro";

const problems = [
  "Customer data in one spreadsheet, ownership in another",
  "A pipeline number nobody actually trusts",
  "Contract terms buried in a shared drive",
  "Qualification applied differently by every rep",
  "No view of which sectors are growing",
  "Cross-sell opportunities quietly missed",
];

export function ProblemSection() {
  return (
    <Panel className="grid gap-8 md:grid-cols-2 md:items-center md:gap-14">
      <SectionIntro
        eyebrow="The problem"
        title="Commercial work runs on a patchwork that never agrees with itself"
        description="Sales, account management and leadership each keep their own version of the account list. None of them match, and the cost is missed renewals, blown forecasts and deals nobody saw slipping."
      />
      <ul className="flex flex-col gap-2">
        {problems.map((p) => (
          <li
            key={p}
            className="bg-card rounded-row flex items-center gap-3 px-4 py-3.5 text-[15px]"
          >
            <span className="bg-soft grid size-8 shrink-0 place-items-center rounded-full">
              <X className="size-4" />
            </span>
            <span className="text-pretty">{p}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
