import { Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * App buttons per docs/03-design/01-design-system.md "Buttons": pills; `hero` is the black
 * pill with its icon in a white circle (at most one per area). The marketing site keeps
 * `components/ui/button`.
 */
const VARIANT = {
  hero: "bg-ink text-shell hover:opacity-90",
  primary: "bg-ink text-shell hover:opacity-90",
  secondary: "border-[1.5px] border-ink hover:bg-soft",
  tertiary: "bg-soft hover:bg-line",
  ghost: "hover:bg-soft",
  destructive: "border-[1.5px] border-danger text-danger hover:bg-danger/10",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

const SIZE = {
  sm: "h-[34px] px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-[52px] px-[26px] text-[15px] gap-2",
} as const;

export function AppButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const hero = variant === "hero";
  const glyph = loading ? (
    <Loader2 className="size-4 animate-spin" />
  ) : Icon ? (
    <Icon className="size-4" />
  ) : null;
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        SIZE[size],
        VARIANT[variant],
        hero && glyph && "pl-1.5",
        className,
      )}
      {...props}
    >
      {hero && glyph ? (
        <span
          className={cn(
            "bg-shell text-ink grid place-items-center rounded-full transition-transform duration-200 group-hover:rotate-[-8deg]",
            size === "sm" ? "size-[26px]" : size === "lg" ? "size-10" : "size-[34px]",
          )}
        >
          {glyph}
        </span>
      ) : (
        glyph
      )}
      {children}
    </button>
  );
}
