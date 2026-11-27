"use client";

import { useEffect, useRef, useState } from "react";
import { ListFilter, Search, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { KitCheckbox } from "./kit-checkbox";

export type FilterGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const SEARCH_DELAY_MS = 300;

/**
 * The row above every list (design system, "Filter bar and menus"): search pill, Filters pill
 * with a checklist panel, result count, and a second row of black chips for what is set.
 * Values combine with OR within a filter and AND across filters; the page owns the state
 * (in the URL) and applies it.
 */
export function FilterBar({
  searchLabel,
  searchPlaceholder = "Search",
  search,
  onSearchChange,
  groups,
  selected,
  onSelectedChange,
  shown,
  total,
  onClearAll,
  children,
}: {
  /** Accessible name of the search box, e.g. "Search accounts". */
  searchLabel: string;
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (q: string) => void;
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onSelectedChange: (key: string, values: string[]) => void;
  /** Result count: `shown` of `total`. */
  shown: number;
  total: number;
  onClearAll: () => void;
  /** Extra controls after the Filters pill (e.g. a phone sort menu). */
  children?: React.ReactNode;
}) {
  const setCount = groups.reduce((n, g) => n + (selected[g.key]?.length ?? 0), 0);
  const chips = groups.flatMap((g) =>
    (selected[g.key] ?? []).map((value) => ({
      group: g,
      value,
      label: g.options.find((o) => o.value === value)?.label ?? value,
    })),
  );

  function toggle(key: string, value: string) {
    const current = selected[key] ?? [];
    onSelectedChange(
      key,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchPill
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
        />

        <Popover>
          <PopoverTrigger
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors",
              setCount ? "bg-ink text-shell" : "bg-soft hover:bg-line",
            )}
          >
            <ListFilter aria-hidden className="size-4" />
            Filters
            {setCount > 0 && (
              <span className="bg-shell text-ink rounded-full px-[7px] py-px text-[11px] tabular-nums">
                {setCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="bg-card text-ink border-line w-[min(92vw,560px)] rounded-3xl border p-2.5 shadow-[0_24px_60px_rgb(0_0_0/0.16)]"
          >
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
              {groups.map((g) => (
                <fieldset key={g.key} className="min-w-0">
                  <legend className="text-mute px-2 py-1.5 text-xs font-semibold tracking-[0.06em] uppercase">
                    {g.label}
                  </legend>
                  {g.options.map((o) => {
                    const id = `filter-${g.key}-${o.value}`;
                    return (
                      <div
                        key={o.value}
                        className="hover:bg-soft flex items-center gap-2.5 rounded-xl p-2 text-sm"
                      >
                        <KitCheckbox
                          id={id}
                          checked={(selected[g.key] ?? []).includes(o.value)}
                          onChange={() => toggle(g.key, o.value)}
                        />
                        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate">
                          {o.label}
                        </label>
                      </div>
                    );
                  })}
                </fieldset>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {children}

        <p className="text-mute ml-auto text-[13px] tabular-nums" aria-live="polite">
          {shown} of {total}
        </p>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={`${c.group.key}:${c.value}`}
              type="button"
              aria-label={`Remove ${c.group.label}: ${c.label}`}
              onClick={() => toggle(c.group.key, c.value)}
              className="bg-ink text-shell inline-flex items-center gap-1.5 rounded-full py-[5px] pr-2 pl-3 text-xs font-semibold"
            >
              {c.group.label}: {c.label}
              <X aria-hidden className="size-3.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-mute hover:text-ink ml-1 text-[13px] font-semibold underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/** Search as you type, sent after a short pause; follows the value when the page clears it. */
function SearchPill({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (q: string) => void;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sent = useRef(value);

  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function update(next: string) {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      sent.current = next.trim();
      onChange(next.trim());
    }, SEARCH_DELAY_MS);
  }

  return (
    <label className="bg-soft text-mute focus-within:outline-ink flex h-10 min-w-[180px] flex-[1_1_220px] items-center gap-2 rounded-full px-3.5 focus-within:outline-2 sm:flex-[0_1_280px]">
      <Search aria-hidden className="size-4 shrink-0" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => update(e.target.value)}
        className="text-ink placeholder:text-mute min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label="Empty the search box"
          onClick={() => update("")}
          className="hover:text-ink grid size-6 place-items-center rounded-full"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </label>
  );
}
