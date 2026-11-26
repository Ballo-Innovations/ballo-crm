import { GradientText } from "./gradient-text";
import { SectionIntro } from "./section-intro";

const personas = [
  {
    role: "Enterprise Account Managers",
    outcome:
      "Keep a portfolio of accounts healthy and growing - see health scores, contract renewals, and touchpoint history in one place.",
  },
  {
    role: "VP of Sales",
    outcome:
      "Trust the pipeline number you report to the board. Forecast, win rate, and velocity by vertical, without a one-off request to RevOps.",
  },
  {
    role: "RevOps / Sales Ops Analysts",
    outcome:
      "Configure qualification scoring and vertical indexing once, org-wide. Clean, consistent data with an audit trail on every override.",
  },
  {
    role: "Customer Success Leads",
    outcome:
      "Catch at-risk accounts before renewal using health signals from BalloAds, and trigger re-engagement without leaving the CRM.",
  },
  {
    role: "Sales Representatives",
    outcome:
      "Log activity and move pipeline with low friction, and get next-best-action recommendations on the deals that matter.",
  },
  {
    role: "Executives",
    outcome:
      "Roll-up commercial analytics and account-health distribution at a glance - the picture, without the manual assembly.",
  },
];

export function PersonasSection() {
  return (
    <section id="personas" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <SectionIntro
          align="left"
          eyebrow="Who it's for"
          title={
            <>
              Built for everyone who owns <GradientText>commercial relationships</GradientText>
            </>
          }
          description="From the rep logging today's call to the VP reporting to the board: one platform, each role served by the same connected data."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <div
              key={p.role}
              className="bg-background hover:border-brand/40 relative flex flex-col gap-2 overflow-hidden rounded-xl border p-6 transition-colors"
            >
              <span
                aria-hidden
                className="from-brand to-primary absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r"
              />
              <h3 className="font-medium">{p.role}</h3>
              <p className="text-muted-foreground text-sm text-pretty">{p.outcome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
