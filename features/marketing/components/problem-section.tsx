import { ArrowRight } from "lucide-react";

const problems = [
  "Customer data in one spreadsheet, ownership in another",
  "A pipeline number nobody actually trusts",
  "Contract terms buried in a shared drive",
  "Health signals locked inside the messaging platform",
  "Qualification applied inconsistently across reps",
  "Cross-sell opportunities quietly missed",
];

export function ProblemSection() {
  return (
    <section className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:gap-16">
        <div className="flex flex-col gap-4">
          <span className="text-muted-foreground text-sm font-medium">The problem</span>
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            B2B commercial operations run on a patchwork that never agrees with itself
          </h2>
          <p className="text-muted-foreground text-pretty">
            Sales reps, account managers, and leadership each keep their own version of &ldquo;the
            account list.&rdquo; None of them match - and the cost is missed renewals, blown
            forecasts, and churn nobody saw coming.
          </p>
        </div>

        <ul className="flex flex-col divide-y rounded-xl border">
          {problems.map((p) => (
            <li key={p} className="flex items-center gap-3 px-4 py-3 text-sm">
              <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              <span className="text-pretty">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
