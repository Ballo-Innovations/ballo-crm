"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * BalloCRM brand lockup: the app-icon mark plus the wordmark. The mark is the
 * real logo asset — a self-contained rounded tile, so it reads correctly on
 * any background. Dark mode swaps to a dedicated asset (public/brand-icon-dark.png)
 * once mounted, to avoid a hydration mismatch on the theme-dependent src.
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
      <BrandMark className="size-8" />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">{siteConfig.name}</span>
      )}
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const src = mounted && resolvedTheme === "dark" ? "/brand-icon-dark.png" : "/brand-icon.png";

  return (
    <Image
      src={src}
      alt="BalloCRM"
      width={128}
      height={128}
      className={cn("size-8 object-contain", className)}
    />
  );
}
