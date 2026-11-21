import { cn } from "@/lib/utils";

/**
 * Brand gradient accent for a highlighted phrase inside a heading (Resend-style).
 * Mid-tone cyan → blue → indigo so it reads in both light and dark themes.
 */
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-[oklch(0.72_0.14_228)] via-[oklch(0.62_0.15_262)] to-[oklch(0.58_0.16_292)] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
