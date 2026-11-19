import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-logo";

/**
 * Section header in the Resend idiom: an optional centered app-icon, a small
 * eyebrow, a large serif display heading (pass a <GradientText> segment for the
 * accent phrase), and a supporting line. Left- or center-aligned.
 */
export function SectionIntro({
  eyebrow,
  title,
  description,
  showMark = false,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  showMark?: boolean;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        centered ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl items-start text-left",
        className,
      )}
    >
      {showMark && <BrandMark className="mb-2 size-14 drop-shadow-lg" />}
      {eyebrow && (
        <span className="text-muted-foreground text-sm font-medium tracking-wide">{eyebrow}</span>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && <p className="text-muted-foreground text-lg text-pretty">{description}</p>}
    </div>
  );
}
