import { cn } from "@/lib/utils";

export type Grade = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
const GRADE_LABEL: Record<Grade, string> = {
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
};

/** Neutral pill for status and stage; `strong` is the solid black version. */
export function Pill({
  strong,
  className,
  children,
}: {
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-[5px] text-xs whitespace-nowrap",
        strong ? "bg-ink text-shell border-ink" : "bg-soft border-line",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Grade pill, always "Gold · 58" so it never relies on colour.
 * Platinum and Gold are solid black; Silver and Bronze are soft with a border.
 */
export function GradeBadge({ grade, score }: { grade: Grade; score?: number }) {
  return (
    <Pill strong={grade === "PLATINUM" || grade === "GOLD"} className="font-semibold">
      {GRADE_LABEL[grade]}
      {score !== undefined && <span className="tabular-nums"> · {score}</span>}
    </Pill>
  );
}
