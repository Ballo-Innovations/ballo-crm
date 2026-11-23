"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CornerDownLeft, Moon, Plus, Search, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { notify } from "@/components/feedback/notify";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import { primaryNav } from "@/lib/site";
import { splitMatch } from "@/lib/text";

/**
 * Command palette per docs/03-design/01-design-system.md "Command palette" (centred).
 * Actions work today. Record results (Opportunities, Accounts, Leads, Contacts) plug in
 * through `PaletteRecord` once the search endpoint lands (E8-06).
 */
export type PaletteRecord = {
  id: string;
  group: "Opportunities" | "Accounts" | "Leads" | "Contacts";
  title: string;
  subtitle: string;
  /** Right-hand detail, e.g. "K6.4M · Gold 58". */
  meta?: string;
  initials: string;
  href: string;
};

type PaletteAction = {
  id: string;
  title: string;
  icon: LucideIcon;
  hint?: string;
  keywords?: string[];
  run: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");

  function close() {
    onOpenChange(false);
    setQuery("");
  }

  const quick: PaletteAction[] = [
    {
      id: "new-lead",
      title: "New lead",
      icon: Plus,
      run: () => notify.info("The lead form comes with E1-01"),
    },
    {
      id: "new-opp",
      title: "New opportunity",
      icon: Plus,
      run: () => notify.info("The opportunity form comes with the pipeline"),
    },
    {
      id: "theme",
      title: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      keywords: ["theme", "dark", "light"],
      run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    },
  ];
  const goTo: PaletteAction[] = primaryNav.map((item) => ({
    id: "go-" + item.href,
    title: "Go to " + item.title,
    icon: NAV_ICONS[item.href] ?? Search,
    keywords: [item.summary],
    run: () => router.push(item.href),
  }));
  // TODO(E8-06): fetch records for `query` (debounced, permission-scoped) and render them
  // grouped above the actions.
  const records: PaletteRecord[] = [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      label="Search and commands"
      loop
      overlayClassName="fixed inset-0 z-50 bg-black/28 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      contentClassName="bg-card text-ink fixed z-50 flex flex-col overflow-hidden shadow-[0_30px_80px_rgb(0_0_0/0.28)] inset-0 md:inset-auto md:top-[90px] md:left-1/2 md:w-[600px] md:max-w-[calc(100%-32px)] md:max-h-[470px] md:-translate-x-1/2 md:rounded-[26px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:duration-200"
    >
      <div className="border-line flex h-[58px] shrink-0 items-center gap-2.5 border-b px-[18px]">
        <Search className="text-mute size-[18px] shrink-0" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search or type a command…"
          className="placeholder:text-mute min-w-0 flex-1 bg-transparent text-[17px] font-medium outline-none"
        />
        <button
          type="button"
          onClick={close}
          className="border-line text-mute rounded-md border px-1.5 py-px text-[11px] font-medium"
        >
          esc
        </button>
      </div>

      <Command.List className="min-h-0 flex-1 overflow-y-auto p-2">
        <Command.Empty className="text-mute p-[30px] text-center text-sm">
          No results for “{query}”. Try a company, contact or action.
        </Command.Empty>

        {records.length > 0 &&
          (["Opportunities", "Accounts", "Leads", "Contacts"] as const).map((group) => {
            const rows = records.filter((r) => r.group === group);
            if (!rows.length) return null;
            return (
              <Group key={group} heading={group}>
                {rows.map((r) => (
                  <Row
                    key={r.id}
                    value={r.id + " " + r.title}
                    query={query}
                    title={r.title}
                    subtitle={r.subtitle}
                    meta={r.meta}
                    lead={r.initials}
                    onSelect={() => {
                      close();
                      router.push(r.href);
                    }}
                  />
                ))}
              </Group>
            );
          })}

        <Group heading="Quick actions">
          {quick.map((a) => (
            <Row
              key={a.id}
              value={a.title}
              keywords={a.keywords}
              query={query}
              title={a.title}
              lead={<a.icon className="size-4" />}
              onSelect={() => {
                close();
                a.run();
              }}
            />
          ))}
        </Group>
        <Group heading="Go to">
          {goTo.map((a) => (
            <Row
              key={a.id}
              value={a.title}
              keywords={a.keywords}
              query={query}
              title={a.title}
              lead={<a.icon className="size-4" />}
              onSelect={() => {
                close();
                a.run();
              }}
            />
          ))}
        </Group>
      </Command.List>

      <div
        aria-hidden
        className="border-line text-mute hidden shrink-0 gap-4 border-t px-4 py-2.5 text-xs md:flex"
      >
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span>esc close</span>
      </div>
    </Command.Dialog>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:text-mute [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  );
}

function Row({
  value,
  keywords,
  query,
  title,
  subtitle,
  meta,
  lead,
  onSelect,
}: {
  value: string;
  keywords?: string[];
  query: string;
  title: string;
  subtitle?: string;
  meta?: string;
  lead: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="group data-[selected=true]:bg-soft flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-[9px] text-sm"
    >
      <span className="bg-soft group-data-[selected=true]:bg-card grid size-[34px] shrink-0 place-items-center rounded-full text-xs font-bold">
        {lead}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">
          {splitMatch(title, query).map((p, i) =>
            p.match ? (
              <mark
                key={i}
                className="bg-transparent font-extrabold text-inherit underline underline-offset-[3px]"
              >
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </span>
        {subtitle && <span className="text-mute truncate text-xs">{subtitle}</span>}
      </span>
      {meta && <span className="text-mute text-xs whitespace-nowrap">{meta}</span>}
      <CornerDownLeft className="text-mute hidden size-3.5 group-data-[selected=true]:block" />
    </Command.Item>
  );
}
