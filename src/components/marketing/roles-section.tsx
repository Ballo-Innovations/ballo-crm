import { BarChart3, Building2, Kanban, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { SectionIntro } from "./section-intro";

const roles: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Account managers",
    description: "See health, renewals and the buying committee before every call.",
  },
  {
    icon: BarChart3,
    title: "Sales leaders",
    description: "One pipeline number the board can trust, by vertical and by rep.",
  },
  {
    icon: Kanban,
    title: "Reps",
    description: "A focus list each morning: the deals that matter and what to do next.",
  },
];

export function RolesSection() {
  return (
    <section
      id="roles"
      className="mx-auto w-full max-w-[1180px] scroll-mt-24 px-2 pb-16 md:px-4 md:pb-24"
    >
      <SectionIntro eyebrow="Who it's for" title="From the rep to the board." />
      <div className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
        {roles.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="border-line rounded-card flex flex-col gap-2.5 border p-6">
            <span
              className={cn(
                "mb-1 grid size-10 place-items-center rounded-full",
                i === 0 ? "bg-ink text-shell" : "bg-soft",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-mute text-[15px] text-pretty">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
