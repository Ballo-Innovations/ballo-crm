import { cn } from "@/lib/utils";

/** Section heading in the app's type scale: small pill eyebrow, bold title, muted line. */
export function SectionIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col items-start gap-3", className)}>
      {eyebrow && (
        <span className="bg-card rounded-full px-3 py-[5px] text-xs font-semibold">{eyebrow}</span>
      )}
      <h2 className="text-[28px] leading-tight font-bold tracking-tight text-balance md:text-[36px]">
        {title}
      </h2>
      {description && (
        <p className="text-mute text-[15px] text-pretty md:text-[17px]">{description}</p>
      )}
    </div>
  );
}
