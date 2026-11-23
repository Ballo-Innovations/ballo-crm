"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The open record lives in the URL (`?open=<id>`) so a drawer can be shared or reloaded.
 * Pages using this need a <Suspense> boundary (useSearchParams).
 */
export function useOpenParam() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openId = params.get("open");
  const setOpenId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params);
      if (id) next.set("open", id);
      else next.delete("open");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
  return [openId, setOpenId] as const;
}

/** List + docked drawer side by side; the list shrinks to make room. */
export function DockedSplit({ children }: { children: React.ReactNode }) {
  return <div className="relative flex min-h-0 gap-0">{children}</div>;
}

/**
 * Docked side panel per docs/03-design/01-design-system.md "Drawer": a 400px card inside the
 * content panel, no scrim. Esc or ✕ closes; focus moves in on open and back on close.
 * On phones it covers the content panel and slides in from the right.
 */
export function DockedDrawer({
  open,
  onClose,
  title,
  subtitle,
  avatar,
  tabs,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  tabs?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label={title}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "bg-card ease-ballo flex flex-col overflow-hidden outline-none",
        // desktop: docked column that grows from 0 to 400px
        "md:rounded-drawer md:sticky md:top-0 md:max-h-[calc(100dvh-140px)] md:shrink-0 md:transition-[width,opacity,margin] md:duration-300",
        open ? "md:ml-4 md:w-[400px] md:opacity-100" : "md:ml-0 md:w-0 md:opacity-0",
        // phone: covers the content panel, slides in from the right
        "max-md:fixed max-md:inset-2 max-md:z-30 max-md:rounded-3xl max-md:transition-transform max-md:duration-300",
        open ? "max-md:translate-x-0" : "max-md:translate-x-[110%]",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col md:min-w-[400px]">
        <div className="flex items-start gap-3 px-[22px] pt-5">
          {avatar}
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] leading-tight font-semibold">{title}</h2>
            {subtitle && <p className="text-mute text-[13px]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-soft hover:bg-line grid size-9 shrink-0 place-items-center rounded-full transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        {tabs && <div className="px-[22px] pt-4">{tabs}</div>}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[18px]">
          {children}
        </div>
        {footer && (
          <div className="border-line flex justify-between gap-2.5 border-t px-[22px] py-3.5">
            {footer}
          </div>
        )}
      </div>
    </aside>
  );
}
