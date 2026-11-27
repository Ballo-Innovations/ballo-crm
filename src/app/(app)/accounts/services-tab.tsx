"use client";

import { EmptyState, ErrorState, GhostRows } from "@/components/shared/page-states";
import { formatDate } from "@/lib/dates";
import { formatZMW } from "@/lib/money";
import { cn } from "@/lib/utils";
import { usageLevel } from "@/modules/accounts/service";
import type { ServiceRow, ServicesView } from "@/modules/accounts/types";

/** What the page loaded for the tab: the services, or an error. */
export type ServicesState = ServicesView | "error";

const USAGE_NOTE = {
  high: "Near capacity: room to upsell",
  normal: "",
  low: "Low use: check in",
  unknown: "No usage data",
} as const;

function UsageBar({ pct }: { pct: number | null }) {
  const level = usageLevel(pct);
  if (pct === null) return <p className="text-mute text-xs">{USAGE_NOTE.unknown}</p>;
  return (
    <div className="flex flex-col gap-1">
      <div
        role="meter"
        aria-label="Usage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="bg-card h-2 overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full", level === "high" ? "bg-ink" : "bg-bar2")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-mute flex justify-between text-xs tabular-nums">
        <span>{USAGE_NOTE[level]}</span>
        <span>{pct}% used</span>
      </p>
    </div>
  );
}

function Service({ s }: { s: ServiceRow }) {
  return (
    <li className="bg-soft flex flex-col gap-2 rounded-2xl p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold">{s.name}</p>
          <p className="text-mute text-[13px]">
            {[s.category, `since ${formatDate(s.startDate)}`].filter(Boolean).join(" · ")}
            {s.endDate && ` · ended ${formatDate(s.endDate)}`}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatZMW(s.annualValue)}
          <span className="text-mute font-normal"> /yr</span>
        </span>
      </div>
      {!s.endDate && <UsageBar pct={s.usagePct} />}
    </li>
  );
}

/**
 * Account 360 Services tab (E2-04): what the account buys, with usage, and the whitespace it
 * leaves - catalogue products it does not buy, at list price. The recommender (E5) ranks
 * that whitespace; this tab shows it.
 */
export function ServicesTab({
  services,
  loading,
  onRetry,
}: {
  services: ServicesState | null;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading || services === null) return <GhostRows count={3} />;
  if (services === "error") {
    return (
      <ErrorState title="Services didn't load" text="Try again in a moment." onRetry={onRetry} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[15px] font-semibold">Services bought</h3>
          <p className="text-mute text-[13px]">
            ARR{" "}
            <span data-testid="services-arr" className="text-ink font-semibold tabular-nums">
              {formatZMW(services.arr)}
            </span>
          </p>
        </div>
        {services.active.length === 0 ? (
          <EmptyState
            title="No services yet"
            text="This account doesn't buy anything yet. Everything below is open to sell."
            actions={null}
          />
        ) : (
          <ul aria-label="Services bought" className="flex flex-col gap-2">
            {services.active.map((s) => (
              <Service key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>

      {services.whitespace.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-semibold">Not bought yet</h3>
            <p className="text-mute text-[13px]">
              Whitespace{" "}
              <span
                data-testid="services-whitespace"
                className="text-ink font-semibold tabular-nums"
              >
                {formatZMW(services.whitespaceValue)}
              </span>
            </p>
          </div>
          <ul aria-label="Not bought yet" className="flex flex-col gap-1.5">
            {services.whitespace.map((p) => (
              <li
                key={p.code}
                className="border-line flex items-center justify-between gap-3 rounded-2xl border border-dashed px-3.5 py-2.5"
              >
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-mute block text-xs">{p.category}</span>
                </span>
                <span className="text-mute shrink-0 text-[13px] tabular-nums">
                  {formatZMW(p.listPrice)} list
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {services.ended.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="text-[15px] font-semibold">Ended</h3>
          <ul aria-label="Ended services" className="flex flex-col gap-2 opacity-70">
            {services.ended.map((s) => (
              <Service key={s.id} s={s} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
