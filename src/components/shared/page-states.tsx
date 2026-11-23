"use client";

import { useEffect, useState } from "react";
import { Info, Loader2, Search } from "lucide-react";

import { AppButton } from "@/components/shared/app-button";
import { cn } from "@/lib/utils";

/**
 * Page states per docs/03-design/01-design-system.md "Empty, loading and error states".
 * Every list and page has all five: loaded, loading, empty, no results, error.
 */

/** Black loader pill: white circle with a spinner and a short message. */
export function LoaderPill({ label }: { label: string }) {
  return (
    <span className="bg-ink text-shell flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-medium shadow-[0_10px_30px_rgb(0_0_0/0.18)]">
      <span className="bg-shell text-ink grid size-[30px] place-items-center rounded-full">
        <Loader2 className="size-4 animate-spin" />
      </span>
      {label}
    </span>
  );
}

/**
 * Wraps the content area. While `loading`, the children (real layout or placeholder
 * content) blur with the loader pill on top; nothing shows for the first 300ms so fast
 * loads never flash. When loading ends, the content sharpens over 600ms.
 */
export function LoadingVeil({
  loading,
  label,
  children,
}: {
  loading: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const [wasShown, setWasShown] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShown(false);
      return;
    }
    const t = setTimeout(() => {
      setShown(true);
      setWasShown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div className="relative" aria-busy={loading}>
      <div
        className={cn(
          "transition-[filter,opacity] duration-[600ms]",
          shown && "pointer-events-none opacity-50 blur-[7px] grayscale select-none",
          loading && !shown && "invisible",
          !loading && wasShown && "opacity-100",
        )}
      >
        {children}
      </div>
      {shown && (
        <div className="absolute inset-0 z-[4] grid place-items-center" role="status">
          <LoaderPill label={label} />
        </div>
      )}
    </div>
  );
}

/** Generic placeholder rows, used behind the loader and the empty message. */
export function GhostRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-soft flex items-center gap-3 rounded-2xl px-3.5 py-3">
          <span className="bg-card size-[34px] rounded-full" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="bg-line h-2.5 rounded" style={{ width: `${55 - i * 7}%` }} />
            <span className="bg-line h-2 w-1/4 rounded" />
          </span>
          <span className="bg-line h-2.5 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/** First use: blurred example rows behind a message with the next actions. */
export function EmptyState({
  title,
  text,
  actions,
}: {
  title: string;
  text: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[300px]">
      <div className="pointer-events-none [mask-image:linear-gradient(#000_30%,transparent)] opacity-55 blur-[5px] grayscale">
        <GhostRows />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
        <div className="bg-card flex flex-col items-center rounded-[28px] px-6 py-3.5 shadow-[0_0_44px_36px_var(--card)]">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-mute mt-1 mb-4 max-w-[360px] text-sm leading-normal">{text}</p>
          <div className="flex flex-wrap justify-center gap-2.5">{actions}</div>
        </div>
      </div>
    </div>
  );
}

function Illustration({ error }: { error?: boolean }) {
  const card =
    "bg-card border-line absolute inset-x-5 flex h-[30px] items-center gap-2 rounded-xl border px-2.5 shadow-[0_6px_16px_rgb(0_0_0/0.06)] before:size-4 before:rounded-full before:bg-soft after:h-1.5 after:flex-1 after:rounded after:bg-soft";
  return (
    <div aria-hidden className="relative mb-[18px] h-[110px] w-[180px]">
      <i className={cn(card, "top-0 scale-[0.86] opacity-50")} />
      <i className={cn(card, "top-[22px] scale-[0.93] opacity-80")} />
      <i className={cn(card, "top-[46px]", error && "border-danger/40")} />
      <span
        className={cn(
          "absolute right-1.5 bottom-1.5 grid size-10 place-items-center rounded-full border-[1.5px] shadow-[0_8px_18px_rgb(0_0_0/0.15)]",
          error ? "bg-danger border-danger text-white" : "bg-card border-ink text-ink",
        )}
      >
        {error ? <Info className="size-[18px]" /> : <Search className="size-[18px]" />}
      </span>
    </div>
  );
}

/** Search or filters matched nothing. */
export function NoResults({
  title,
  text = "Check the spelling or try a company or contact name.",
  onClear,
}: {
  title: string;
  text?: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-[30px] text-center">
      <Illustration />
      <h2 className="mb-1.5 text-lg font-semibold">{title}</h2>
      <p className="text-mute mb-4 max-w-[360px] text-sm leading-normal">{text}</p>
      <AppButton variant="secondary" onClick={onClear}>
        Clear search
      </AppButton>
    </div>
  );
}

/** Couldn't load: reassuring copy, Retry, and a way to get help. */
export function ErrorState({
  title,
  text = "The server didn’t respond. Your data is safe — try again in a moment.",
  onRetry,
  onSupport,
}: {
  title: string;
  text?: string;
  onRetry: () => void;
  onSupport?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center px-4 py-[30px] text-center"
    >
      <Illustration error />
      <h2 className="mb-1.5 text-lg font-semibold">{title}</h2>
      <p className="text-mute mb-4 max-w-[360px] text-sm leading-normal">{text}</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <AppButton onClick={onRetry}>Retry</AppButton>
        {onSupport && (
          <AppButton variant="ghost" onClick={onSupport}>
            Contact support
          </AppButton>
        )}
      </div>
    </div>
  );
}
