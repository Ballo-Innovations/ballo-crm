import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KPI card: icon circle, big number, two-line label. One per row may be `highlight`ed
 * (black icon) and link through with a ↗.
 */
export function KpiCard({
  icon: Icon,
  value,
  label,
  highlight,
  href,
}: {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  highlight?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <span
        className={cn(
          "mx-auto mb-3.5 grid size-[46px] place-items-center rounded-full",
          highlight ? "bg-ink text-shell" : "bg-soft",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-mute mx-auto block max-w-[16ch] text-[13px] leading-snug">{label}</span>
      {href && <ArrowUpRight aria-hidden className="text-mute absolute top-4 right-4 size-4" />}
    </>
  );
  const cls =
    "bg-card rounded-kpi ease-ballo relative block px-2 py-[22px] text-center transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_24px_rgb(0_0_0/0.07)]";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
