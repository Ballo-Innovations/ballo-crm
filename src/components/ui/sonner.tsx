"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toast region per docs/03-design/01-design-system.md "Toasts": bottom centre, 22px up,
 * newest at the bottom, up to 3 with 8px gaps. Toasts themselves are drawn by
 * `notify` (src/components/feedback/notify.tsx); don't call sonner's `toast()` directly.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={22}
      mobileOffset={14}
      gap={8}
      visibleToasts={3}
      expand
      containerAriaLabel="Notifications"
      toastOptions={{
        unstyled: true,
        classNames: { toast: "flex w-full justify-center pointer-events-none" },
      }}
    />
  );
}
