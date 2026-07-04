import { cn } from "@/lib/utils";

/**
 * Single continuous grid + glow canvas behind the entire marketing page
 * (hero through footer). Rendered once at the page level rather than per
 * section, so the grid tiles seamlessly and glow blobs bleed naturally
 * across section boundaries instead of being clipped at each section's own
 * edge.
 */
const BLOBS: { top: string; left: string; size: number }[] = [
  { top: "0%", left: "50%", size: 900 },
  { top: "10%", left: "12%", size: 620 },
  { top: "22%", left: "88%", size: 680 },
  { top: "36%", left: "50%", size: 760 },
  { top: "50%", left: "10%", size: 620 },
  { top: "64%", left: "90%", size: 680 },
  { top: "80%", left: "50%", size: 760 },
  { top: "94%", left: "50%", size: 820 },
  { top: "100%", left: "50%", size: 900 },
];

export function PageBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,transparent,black_4%,black_97%,transparent)] bg-[size:56px_56px] opacity-40" />
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            background: "radial-gradient(circle, var(--brand-muted), transparent 70%)",
          }}
        />
      ))}
    </div>
  );
}
