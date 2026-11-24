import { initials } from "@/lib/text";
import { cn } from "@/lib/utils";

const SIZES = {
  24: "size-6 text-[9px]",
  32: "size-8 text-xs",
  40: "size-10 text-[13px]",
  56: "size-14 text-[21px]",
} as const;

/**
 * Avatar per the design system (option A): grey initials circle for people and companies
 * alike; a logo shows in monochrome in a white circle. The full name is the label.
 */
export function EntityAvatar({
  name,
  size = 40,
  logoUrl,
  online,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  logoUrl?: string;
  online?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "bg-soft text-ink relative grid shrink-0 place-items-center rounded-full font-bold",
        SIZES[size],
        logoUrl && "bg-card shadow-[0_0_0_1px_var(--line)]",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny logos, any origin
        <img src={logoUrl} alt="" className="size-[68%] object-contain grayscale" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      {online && (
        <span
          aria-hidden
          className="bg-ink border-card absolute -right-px -bottom-px size-[28%] min-h-2 min-w-2 rounded-full border-2"
        />
      )}
    </span>
  );
}

/** Overlapping avatars: at most 3, then a black "+N". */
export function AvatarStack({ names, size = 32 }: { names: string[]; size?: 24 | 32 }) {
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  return (
    <span className="flex" aria-label={names.join(", ")} role="group">
      {shown.map((n, i) => (
        <EntityAvatar
          key={n + i}
          name={n}
          size={size}
          className={cn("shadow-[0_0_0_2px_var(--card)]", i > 0 && "-ml-1.5")}
        />
      ))}
      {rest > 0 && (
        <span
          aria-hidden
          className={cn(
            "bg-ink text-shell -ml-1.5 grid place-items-center rounded-full font-bold shadow-[0_0_0_2px_var(--card)]",
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
