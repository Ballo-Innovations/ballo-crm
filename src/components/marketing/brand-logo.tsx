import { CompassMark } from "@/components/shared/compass-mark";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

/**
 * BalloCRM brand lockup: the compass mark plus the wordmark. The mark is drawn in
 * currentColor, so it follows the theme with no light/dark asset swap.
 */
export function BrandLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CompassMark className="size-7" label={showWordmark ? undefined : siteConfig.name} />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">{siteConfig.name}</span>
      )}
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return <CompassMark label={siteConfig.name} className={cn("size-8", className)} />;
}
