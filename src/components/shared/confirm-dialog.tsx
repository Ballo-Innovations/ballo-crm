"use client";

import { AlertDialog } from "radix-ui";
import { Trash2, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppButton } from "./app-button";

/**
 * Confirm dialog per docs/03-design/01-design-system.md "Modals and confirm dialogs": a centred
 * 440px card over a 32% scrim, icon circle, the question as the title, one line on the
 * consequence, Cancel on the left and the named action on the right (solid red when
 * destructive). Esc, ✕ and the scrim cancel, except while the action runs.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  busyLabel,
  destructive,
  icon: Icon = destructive ? Trash2 : undefined,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** One question, e.g. "Delete Lombe Tembo?". */
  title: string;
  description: string;
  /** What the action does, e.g. "Delete" (never "OK"). */
  actionLabel: string;
  busyLabel?: string;
  destructive?: boolean;
  icon?: LucideIcon;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/30" />
        <AlertDialog.Content
          onEscapeKeyDown={(e) => busy && e.preventDefault()}
          className="bg-card text-ink data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] fixed top-1/2 left-1/2 z-50 w-[calc(100vw-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-6 shadow-[0_30px_80px_rgb(0_0_0/0.25)] duration-200"
        >
          <AlertDialog.Cancel
            aria-label="Close"
            disabled={busy}
            className="bg-soft hover:bg-line absolute top-4 right-4 grid size-9 place-items-center rounded-full transition-colors"
          >
            <X aria-hidden className="size-4" />
          </AlertDialog.Cancel>
          {Icon && (
            <span
              className={cn(
                "mb-4 grid size-12 place-items-center rounded-full",
                destructive ? "bg-danger/10 text-danger" : "bg-soft",
              )}
            >
              <Icon aria-hidden className="size-5" />
            </span>
          )}
          <AlertDialog.Title className="pr-10 text-xl font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-mute mt-1.5 text-sm">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild disabled={busy}>
              <AppButton variant="secondary">Cancel</AppButton>
            </AlertDialog.Cancel>
            <AppButton
              variant={destructive ? "danger" : "primary"}
              loading={busy}
              onClick={onConfirm}
            >
              {busy ? (busyLabel ?? actionLabel) : actionLabel}
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
