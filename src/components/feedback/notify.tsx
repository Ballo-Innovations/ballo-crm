"use client";

import { Check, Info, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "loading" | "info";
type Action = { label: string; onClick: () => void };
type Options = {
  /** Reuse an id to turn a loading toast into its result in place. */
  id?: string | number;
  action?: Action;
};

/** Success 4s, with an action 6s, errors and loading stay until dismissed or resolved. */
function duration(kind: Kind, action?: Action) {
  if (kind === "error" || kind === "loading") return Infinity;
  return action ? 6000 : 4000;
}

function ToastPill({
  id,
  kind,
  message,
  action,
}: {
  id: string | number;
  kind: Kind;
  message: string;
  action?: Action;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="bg-ink text-shell pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full py-1.5 pr-2 pl-1.5 text-sm font-medium shadow-[0_10px_30px_rgb(0_0_0/0.18)]"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full",
          kind === "error" ? "bg-danger text-white" : "bg-shell text-ink",
        )}
      >
        {kind === "success" && <Check className="size-4" strokeWidth={2.5} />}
        {kind === "error" && <Info className="size-4" strokeWidth={2.5} />}
        {kind === "info" && <Info className="size-4" strokeWidth={2.5} />}
        {kind === "loading" && <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />}
      </span>
      <span className="min-w-0">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            toast.dismiss(id);
          }}
          className="text-shell rounded-full bg-[color-mix(in_srgb,var(--shell)_16%,transparent)] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap"
        >
          {action.label}
        </button>
      )}
      {kind !== "loading" && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => toast.dismiss(id)}
          className="text-shell grid size-6 shrink-0 place-items-center opacity-60 hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function show(kind: Kind, message: string, opts: Options = {}) {
  return toast.custom(
    (id) => <ToastPill id={id} kind={kind} message={message} action={opts.action} />,
    { id: opts.id, duration: duration(kind, opts.action) },
  );
}

/**
 * The only way to show a toast. Copy: past tense, specific, short ("Lead saved").
 * Not for validation errors or decisions (use the field or a confirm dialog).
 */
export const notify = {
  success: (message: string, opts?: Options) => show("success", message, opts),
  error: (message: string, opts?: Options) => show("error", message, opts),
  info: (message: string, opts?: Options) => show("info", message, opts),
  loading: (message: string, opts?: Options) => show("loading", message, opts),
  dismiss: (id?: string | number) => toast.dismiss(id),
  /** "Lead saved" with Undo; undoing shows "Change undone". */
  undoable(message: string, undo: () => void) {
    return show("success", message, {
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          show("success", "Change undone");
        },
      },
    });
  },
};
