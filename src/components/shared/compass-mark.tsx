import { cn } from "@/lib/utils";

/**
 * BalloCRM logo: a compass ring with a needle, drawn in currentColor so it follows the
 * monochrome theme (ink on light, white on dark). Matches the reference build
 * docs/03-design/reference/dashboard-concept.html and src/app/icon.svg.
 * Pass `label` when the mark stands alone; leave it out when the wordmark sits beside it.
 */
export function CompassMark({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={cn("size-[30px] shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <circle cx="15" cy="15" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M15 6l4 9-4 9-4-9z" fill="currentColor" />
    </svg>
  );
}
