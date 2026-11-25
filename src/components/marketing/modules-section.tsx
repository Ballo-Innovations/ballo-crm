import { LayoutDashboard } from "lucide-react";

import { NAV_ICONS } from "@/components/shell/nav-icons";
import { primaryNav } from "@/lib/site";

import { Panel, SectionIntro } from "./section-intro";

/** The app's own sidebar, one module per card, so the page and the product never drift apart. */
export function ModulesSection() {
  return (
    <Panel id="modules">
      <SectionIntro
        eyebrow="Modules"
        title="The whole commercial workflow, module by module"
        description="One data model, one navigation, one login. Every module shares the same accounts, contacts and activity, so nothing is entered twice."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 md:gap-4 lg:grid-cols-3">
        {primaryNav.map((item, i) => {
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
          const first = i === 0;
          return (
            <div key={item.href} className="bg-card rounded-card flex flex-col gap-3 p-[22px]">
              <span
                className={
                  first
                    ? "bg-ink text-shell flex items-center gap-3 self-start rounded-full p-1.5 pr-5 text-[15px] font-medium"
                    : "flex items-center gap-3 self-start rounded-full p-1.5 pr-5 text-[15px] font-medium"
                }
              >
                <span
                  className={
                    first
                      ? "bg-shell text-ink grid size-9 place-items-center rounded-full"
                      : "bg-soft grid size-9 place-items-center rounded-full"
                  }
                >
                  <Icon className="size-[17px]" strokeWidth={2} />
                </span>
                {item.title}
              </span>
              <p className="text-mute px-1.5 text-[15px] text-pretty">{item.summary}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
