import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** The app's hero button (black pill, icon in a white circle) as a link. */
export function HeroLink({
  href,
  className,
  inverted,
  children,
}: {
  href: string;
  className?: string;
  inverted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-11 items-center gap-2 rounded-full pr-5 pl-1.5 text-sm font-semibold whitespace-nowrap transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.97]",
        inverted ? "bg-shell text-ink" : "bg-ink text-shell",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-[34px] place-items-center rounded-full transition-transform duration-200 group-hover:-rotate-[8deg]",
          inverted ? "bg-ink text-shell" : "bg-shell text-ink",
        )}
      >
        <ArrowRight className="size-4" />
      </span>
      {children}
    </Link>
  );
}
