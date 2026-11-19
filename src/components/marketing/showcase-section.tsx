import { DashboardPreview } from "./dashboard-preview";
import { GradientText } from "./gradient-text";
import { SectionIntro } from "./section-intro";

export function ShowcaseSection() {
  return (
    <section className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-20 md:py-28">
        <SectionIntro
          showMark
          eyebrow="See it in one place"
          title={
            <>
              Your whole commercial operation, <GradientText>on one screen</GradientText>
            </>
          }
          description="Accounts, pipeline, health, and communications — a single, elegant surface your whole revenue team works from."
        />
        <DashboardPreview />
      </div>
    </section>
  );
}
