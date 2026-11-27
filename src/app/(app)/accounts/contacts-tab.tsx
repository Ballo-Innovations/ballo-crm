"use client";

import { useRef, useState, useTransition } from "react";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/feedback/notify";
import { AppButton } from "@/components/shared/app-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, GhostRows } from "@/components/shared/page-states";
import { PillField } from "@/components/shared/pill-field";
import { cn } from "@/lib/utils";
import {
  createContactAction,
  deleteContactAction,
  updateContactAction,
} from "@/modules/accounts/actions";
import { formatPhone } from "@/modules/accounts/service";
import { STANCE_LABEL, STANCES, type ContactRow } from "@/modules/accounts/types";

/** What the page loaded for the tab: the contacts, or an error. */
export type ContactsState = ContactRow[] | "error";

const STANCE_DOT = {
  SUPPORTER: "bg-emerald-600",
  NEUTRAL: "bg-bar2",
  SKEPTIC: "bg-danger",
} as const;

/** Stance as text with a coloured dot: never colour alone (design system, accessibility). */
function StanceBadge({ stance }: { stance: ContactRow["stance"] }) {
  return (
    <span className="border-line bg-card inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold">
      <span aria-hidden className={cn("size-2 rounded-full", STANCE_DOT[stance])} />
      {STANCE_LABEL[stance]}
    </span>
  );
}

function InfluenceDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`Influence ${value} of 5`}>
      <span className="sr-only">Influence {value} of 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden
          className={cn("size-1.5 rounded-full", n <= value ? "bg-ink" : "bg-line")}
        />
      ))}
    </span>
  );
}

const fullName = (c: Pick<ContactRow, "firstName" | "lastName">) => `${c.firstName} ${c.lastName}`;

/**
 * Account 360 Contacts tab (E2-03): the buying contacts with their influence and stance.
 * Owners and managers add, edit and delete; others see the list read-only.
 */
export function ContactsTab({
  accountId,
  contacts,
  canEdit,
  loading,
  onRetry,
}: {
  accountId: string;
  contacts: ContactsState;
  canEdit: boolean;
  loading: boolean;
  onRetry: () => void;
}) {
  const [editing, setEditing] = useState<ContactRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ContactRow | null>(null);
  const [busy, startBusy] = useTransition();
  const router = useRouter();

  if (loading) return <GhostRows count={3} />;
  if (contacts === "error") {
    return (
      <ErrorState title="Contacts didn't load" text="Try again in a moment." onRetry={onRetry} />
    );
  }
  if (editing) {
    return (
      <ContactForm
        accountId={accountId}
        contact={editing === "new" ? null : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  function remove() {
    if (!deleting) return;
    const name = fullName(deleting);
    startBusy(async () => {
      const res = await deleteContactAction(deleting.id);
      if (res.ok) {
        notify.success(`${name} deleted`);
        setDeleting(null);
        router.refresh();
      } else {
        notify.error(res.error.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex justify-end">
          <AppButton variant="tertiary" size="sm" icon={Plus} onClick={() => setEditing("new")}>
            Add contact
          </AppButton>
        </div>
      )}

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          text={
            canEdit
              ? "Add the people you sell to here: who they are, how much they sway the deal and where they stand."
              : "The account owner hasn't added any contacts yet."
          }
          actions={null}
        />
      ) : (
        <ul aria-label="Contacts" className="flex flex-col gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="bg-soft flex flex-col gap-2 rounded-2xl p-3.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[15px] font-semibold">{fullName(c)}</p>
                  {c.title && <p className="text-mute truncate text-[13px]">{c.title}</p>}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${fullName(c)}`}
                      onClick={() => setEditing(c)}
                      className="hover:bg-card grid size-8 place-items-center rounded-full transition-colors"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${fullName(c)}`}
                      onClick={() => setDeleting(c)}
                      className="hover:bg-card text-danger grid size-8 place-items-center rounded-full transition-colors"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
                <StanceBadge stance={c.stance} />
                <InfluenceDots value={c.influence} />
              </div>
              {(c.email || c.phone) && (
                <div className="text-mute flex flex-col gap-1 text-[13px]">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="hover:text-ink flex items-center gap-2 truncate"
                    >
                      <Mail aria-hidden className="size-3.5 shrink-0" />
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="hover:text-ink flex items-center gap-2">
                      <Phone aria-hidden className="size-3.5 shrink-0" />
                      {formatPhone(c.phone)}
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete ${fullName(deleting)}?` : ""}
        description="They will be removed from this account. The change is kept in the audit log."
        actionLabel="Delete"
        busyLabel="Deleting…"
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </div>
  );
}

type Fields = Record<string, string>;

const FIX_TOAST = "contact-form-errors";

/** Add or edit one contact. Errors come back from the server per field and show inline. */
function ContactForm({
  accountId,
  contact,
  onDone,
}: {
  accountId: string;
  contact: ContactRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Fields>({});
  const [influence, setInfluence] = useState(String(contact?.influence ?? 3));
  const [stance, setStance] = useState<string>(contact?.stance ?? "NEUTRAL");
  const [saving, startSaving] = useTransition();

  /** The person is fixing a field: clear its error, and the toast so it never covers Save. */
  function fixing(name: string) {
    if (!(name in errors)) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    notify.dismiss(FIX_TOAST);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Fields;
    const input = { ...data, influence, stance };
    startSaving(async () => {
      const res = contact
        ? await updateContactAction(contact.id, input)
        : await createContactAction(accountId, input);
      if (res.ok) {
        notify.dismiss(FIX_TOAST);
        notify.success(contact ? "Contact saved" : "Contact added");
        router.refresh();
        onDone();
        return;
      }
      setErrors(res.error.fields ?? {});
      if (res.error.fields) {
        notify.error("Fix the highlighted fields", { id: FIX_TOAST });
        const first = Object.keys(res.error.fields)[0];
        form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      } else {
        notify.error(res.error.message);
      }
    });
  }

  return (
    <form
      ref={form}
      onSubmit={submit}
      onChange={(e) => fixing(e.target instanceof HTMLInputElement ? e.target.name : "")}
      noValidate
      className="flex flex-col gap-1"
    >
      <p className="text-[15px] font-semibold">{contact ? "Edit contact" : "New contact"}</p>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <PillField
          name="firstName"
          label="First name"
          defaultValue={contact?.firstName}
          error={errors.firstName}
          autoFocus
        />
        <PillField
          name="lastName"
          label="Last name"
          defaultValue={contact?.lastName}
          error={errors.lastName}
        />
      </div>
      <PillField
        name="title"
        label="Job title (optional)"
        defaultValue={contact?.title ?? ""}
        error={errors.title}
      />
      <PillField
        name="email"
        type="email"
        label="Email (optional)"
        defaultValue={contact?.email ?? ""}
        error={errors.email}
      />
      <PillField
        name="phone"
        type="tel"
        label="Phone (optional)"
        defaultValue={contact?.phone ? formatPhone(contact.phone) : ""}
        error={errors.phone}
      />

      <Choice
        label="Influence"
        help="How much they sway the decision, 1 to 5."
        options={["1", "2", "3", "4", "5"].map((v) => ({
          value: v,
          label: v,
          aria: `Influence ${v}`,
        }))}
        value={influence}
        onChange={(v) => {
          setInfluence(v);
          fixing("influence");
        }}
        error={errors.influence}
      />
      <Choice
        label="Stance"
        options={STANCES.map((s) => ({ value: s, label: STANCE_LABEL[s], aria: STANCE_LABEL[s] }))}
        value={stance}
        onChange={(v) => {
          setStance(v);
          fixing("stance");
        }}
        error={errors.stance}
      />

      <div className="mt-4 flex justify-between gap-2.5">
        <AppButton type="button" variant="secondary" size="sm" onClick={onDone} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" size="sm" loading={saving}>
          {saving ? "Saving…" : "Save contact"}
        </AppButton>
      </div>
    </form>
  );
}

/** A row of pill radios (design system: chips, black when selected). */
function Choice({
  label,
  help,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  help?: string;
  options: { value: string; label: string; aria: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1.5 pt-3">
      <span className={cn("text-[13px] font-semibold", error && "text-danger")}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            aria-label={o.aria}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 min-w-9 rounded-full px-3.5 text-sm font-semibold transition-colors",
              value === o.value ? "bg-ink text-shell" : "bg-soft hover:bg-line",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {(error ?? help) && (
        <p className={cn("pl-1 text-xs", error ? "text-danger" : "text-mute")}>{error ?? help}</p>
      )}
    </div>
  );
}
