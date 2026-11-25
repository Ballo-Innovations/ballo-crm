import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The same black "b" mark and wordmark the app sidebar and login page use. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-xl font-bold md:text-2xl", className)}
    >
      <BrandMark />
      {siteConfig.name}
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-ink text-shell grid size-9 shrink-0 place-items-center rounded-full text-base font-bold",
        className,
      )}
    >
      b
    </span>
  );
}
