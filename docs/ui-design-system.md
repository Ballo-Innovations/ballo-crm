# UI Design System

BalloCRM's visual and interaction language, targeting enterprise SaaS density and clarity in the
spirit of Salesforce, HubSpot, Linear, Stripe Dashboard, Vercel Dashboard, Notion, and Retool —
minimal chrome, information-dense tables and forms for power users, not a consumer-app
whitespace-heavy layout. This document is binding: new UI should reuse the tokens and components
described here before introducing new ones.

See also: [routes.md](./routes.md) for which components each page uses,
[tech-stack.md](./tech-stack.md) for the framework versions, and
[coding-standards.md](./coding-standards.md) for file/component conventions.

## Component inventory (installed today)

`components.json` uses shadcn style **`radix-nova`** (Radix UI primitives), base color
**`neutral`**, icon library **`lucide`**. The following are installed in `components/ui/` — this
is the current, real inventory; do not reference a shadcn component that isn't in this list:

```
alert            alert-dialog     avatar           badge
breadcrumb       button           calendar         card
checkbox         command          dialog           dropdown-menu
field            input-group      input            label
navigation-menu  pagination       popover          progress
scroll-area      select           separator        sheet
skeleton         sonner           switch           table
tabs             textarea         tooltip
```

To add another component: `npx shadcn@latest add <name>` (it will respect the `radix-nova`
style/`neutral` base color already configured in `components.json`). Do not hand-roll a component
that shadcn already offers — add it instead, so it inherits the token system below for free.

## Typography

Font is **Geist** (sans) and **Geist Mono**, loaded via `next/font` in `app/layout.tsx` and
exposed as the Tailwind v4 theme vars `--font-sans` / `--font-mono` in `app/globals.css`. There is
also a `--font-heading` var, currently aliased to `--font-sans` — kept distinct on purpose so a
future display face can be swapped in for headings without touching body text.

| Role    | Tailwind classes                                              | Use                                                                        |
| ------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Display | `text-3xl font-semibold tracking-tight`                       | Page-level hero text (rare — mostly reserved for empty states, `/login`)   |
| H1      | `text-2xl font-semibold tracking-tight`                       | Page title (e.g. "Accounts", account name on detail page)                  |
| H2      | `text-xl font-semibold`                                       | Section heading within a page (card group headers, tab section titles)     |
| H3      | `text-base font-medium`                                       | Card title (`CardTitle` default is `text-base font-medium` already)        |
| H4      | `text-sm font-medium`                                         | Sub-section label, field-group legend                                      |
| Body    | `text-sm`                                                     | Default body copy, table cells, form values — the CRM's dominant text size |
| Small   | `text-xs text-muted-foreground`                               | Metadata, timestamps, helper text, table secondary lines                   |
| Caption | `text-[0.7rem] uppercase tracking-wide text-muted-foreground` | Table column group labels, section eyebrows                                |

Default line-height is Tailwind's built-in leading for each size (`leading-snug` for headings,
default for body). Power-user density means most product surfaces use **Body (`text-sm`)** as the
base, not `text-base` — reserve larger sizes for page/section titles only.

## Spacing & grid

- **Base unit:** Tailwind's default 4px scale (`--spacing: 0.25rem`). Prefer multiples of `2`
  (`gap-2`, `p-2`) for dense controls and `4` (`gap-4`, `p-4`) for card/section spacing — avoid
  odd values.
- **Page container:** `max-w-screen-2xl mx-auto` for list/table pages so wide data tables have
  room; detail pages that are form/card-heavy can constrain to `max-w-5xl`.
- **Page padding:** `px-4 py-6 md:px-6` for the main content area inside the (future) app shell.
- **Card spacing:** governed by `card.tsx`'s own `--card-spacing` var (`--spacing(4)` default,
  `--spacing(3)` for `size="sm"`) — don't override with ad hoc padding classes on `CardContent`;
  use the `size` prop.
- **Vertical rhythm between sections on a page:** `space-y-6`. Between form fields inside a
  `FieldGroup`: handled by `field.tsx`'s built-in `gap-5` — don't add extra margin.

## Cards

Use `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`,
`CardFooter`) for every entity-summary surface — account cards, KPI tiles, kanban opportunity
cards.

**Standard entity summary card anatomy** (e.g. an account card used on `/accounts` in a future
card-view toggle, or as the header of `/accounts/[id]`):

```tsx
<Card>
  <CardHeader>
    <CardTitle>Acme Manufacturing Ltd.</CardTitle>
    <CardDescription>Manufacturing · Enterprise</CardDescription>
    <CardAction>
      <Badge
        variant={healthScore >= 70 ? "default" : healthScore >= 40 ? "secondary" : "destructive"}
      >
        Health {healthScore}
      </Badge>
    </CardAction>
  </CardHeader>
  <CardContent className="text-muted-foreground flex items-center gap-4 text-sm">
    <span>Owner: Jane Doe</span>
    <Separator orientation="vertical" className="h-4" />
    <span>3 open opportunities</span>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline" size="sm">
      View timeline
    </Button>
    <Button size="sm">Open account</Button>
  </CardFooter>
</Card>
```

Rules: `CardTitle` is always the entity's primary name; `CardDescription` is one line of
classification metadata (vertical, tier); status/score always renders as a `Badge` in
`CardAction`, never as raw colored text; `CardFooter` (bordered, `bg-muted/50` per the component's
own styling) is reserved for actions, never for data.

## Tables

Use `table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`,
`TableCaption`) for every list view (`/accounts`, `/contacts`, `/opportunities` list mode,
`/contracts`, `/campaigns`).

Conventions:

- **Sticky header:** wrap the table in a container with a fixed max-height and apply
  `sticky top-0 bg-background` to `TableHeader` (or its `TableRow`) so column headers stay visible
  while scrolling a long list — critical for the density this product targets.
- **Row density:** default row height uses `text-sm` cells with `py-2` — do not use the
  whitespace-heavy default HTML table padding. A "comfortable/compact" density toggle is a
  reasonable future enhancement but not required for Sprint 1.
- **Empty states:** never render a bare empty `<TableBody>`. Render a single `TableRow` spanning
  all columns (`colSpan`) containing a centered `text-sm text-muted-foreground` message plus a
  primary `Button` (e.g. "No accounts yet — Create your first account").
- **Pagination:** use `pagination.tsx` below the table, server-driven (the Server Action accepts
  a cursor/page param, not client-side slicing of a full dataset) — Firestore-backed lists must
  paginate at the query level per [database-schema.md](./database-schema.md) and
  [indexes.md](./indexes.md).
- **Row interaction:** entire row is clickable to the detail route (`onClick` + `cursor-pointer`
  on `TableRow`) with a `hover:bg-muted/50`; row-level actions (edit/delete) live in a trailing
  `TableCell` with a `dropdown-menu.tsx` triggered by an icon-only `Button` (`variant="ghost"
size="icon"`).
- **Sorting/filtering:** sortable column headers toggle via a click handler on `TableHead` with a
  small `lucide-react` chevron indicating direction; filters live in a toolbar above the table
  using `input.tsx` (search), `select.tsx` (categorical filters), not inline per-column filter
  rows.

## Forms

Stack: **React Hook Form** + **Zod** (`@hookform/resolvers/zod`) + shadcn's `field.tsx` primitives.
This shadcn version does **not** ship a legacy `Form`/`FormField` context wrapper — instead, forms
compose `FieldSet`, `FieldGroup`, `Field`, `FieldLabel`, `FieldContent`, `FieldDescription`, and
`FieldError` directly, wiring them to RHF's `register` (uncontrolled inputs) or `Controller`
(shadcn `Select`/`Checkbox`/`Switch`/`Calendar`, which aren't native `<input>` elements and need
controlled binding). The Zod schema in `schemas/` is the single source of truth for both the
`z.infer` type and the resolver.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/features/accounts/schemas/create-account-schema";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateAccountForm({ onSubmit }: { onSubmit: (v: CreateAccountInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({ resolver: zodResolver(createAccountSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Account name</FieldLabel>
            <FieldContent>
              <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
              <FieldDescription>Legal or trading name of the organization.</FieldDescription>
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </FieldSet>
    </form>
  );
}
```

For controlled shadcn inputs, wrap with RHF's `Controller` instead of `register`, e.g. a `Select`
for "vertical": `<Controller name="vertical" control={control} render={({ field }) => (<Select
onValueChange={field.onChange} value={field.value}>…</Select>)} />`. Always pass `aria-invalid`
and mirror it via `data-invalid` on the wrapping `Field` so the destructive-state styling baked
into `field.tsx` and `input.tsx` activates consistently. On submit, call the feature's Server
Action and surface `{ ok: false, error }` results as a `sonner` toast plus (if field-specific) a
`FieldError`, per the convention in [api.md](./api.md).

## Charts

**Recharts**, used on `/dashboard` and `/analytics`. Conventions:

- **Line charts** for trends over time (pipeline value over weeks, win-rate trend).
- **Bar charts** for categorical comparison (opportunities by stage, accounts by vertical).
- **Area charts** (stacked) for composition-over-time (pipeline value by stage over time).
- **Color:** never hardcode hex values in chart code. Use the five chart tokens already defined in
  `app/globals.css` (`--color-chart-1` through `--color-chart-5`, exposed to Tailwind as
  `chart-1`…`chart-5`) via `fill="var(--color-chart-1)"` / `stroke="var(--color-chart-2)"` etc.,
  so charts automatically adapt between light and dark mode. Use one token per series, in order,
  and don't reintroduce the same token for a semantically different series on the same chart.
- **Status/semantic colors on charts** (e.g. a "won" vs. "lost" bar) should use `--color-primary`
  / `--color-destructive` rather than the neutral chart-N sequence, since those carry meaning
  beyond series order — see "Colors" below.
- Wrap every chart in a fixed-height container (`ResponsiveContainer` from Recharts) inside a
  `Card`/`CardContent`, with a `Skeleton` of the same height as the loading state so layout
  doesn't shift.
- Tooltips: use Recharts' `Tooltip` with a custom content renderer styled to match `popover.tsx`
  (bg-popover, text-popover-foreground, rounded, ring) rather than the Recharts default tooltip
  box, for visual consistency with the rest of the app.

## Dialogs vs. sheets

- **`dialog.tsx`** — centered modal for short, focused, in-page interactions that don't need much
  vertical space: confirmations, quick-create forms with ≤5 fields, single-record edits
  (e.g. "Rename campaign"). Use `alert-dialog.tsx` specifically for destructive confirmations
  (delete account, remove member, revoke key) since it forces an explicit acknowledge action.
- **`sheet.tsx`** — slide-over panel (from the right by default) for anything longer-form or that
  benefits from more vertical room without navigating away from list context: full entity
  edit forms (edit account, edit contract), and detail "peek" panels launched from a table row
  without a full page navigation.
- Rule of thumb: if the form has more than ~5 fields, or the user needs to reference the
  underlying list/table while it's open, use `sheet.tsx`. Otherwise use `dialog.tsx`.

## Buttons

`button.tsx` defines the variants/sizes below — use them semantically, don't reach for
`className` overrides for color:

| Variant       | When to use                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`     | Primary action per view/section — "Create account," "Save," "Send." At most one visually dominant `default` button per section.               |
| `outline`     | Secondary actions alongside a `default` action — "Cancel," "Filters," toolbar toggles.                                                        |
| `secondary`   | Tertiary/neutral actions with slightly more visual weight than `ghost` — e.g. "Export," non-primary toolbar actions.                          |
| `ghost`       | Low-emphasis actions, especially icon-only buttons in tables/toolbars, or actions inside a `Card`/`TableRow` that shouldn't compete visually. |
| `destructive` | Delete/remove/revoke actions — pair with `alert-dialog.tsx` confirmation.                                                                     |
| `link`        | Inline text-styled actions inside body copy or table cells (e.g. "View details" inline in a sentence).                                        |

Sizes: `default` and `lg` for standalone page actions, `sm`/`xs` for compact toolbars and in-table
actions, `icon`/`icon-sm`/`icon-xs` for icon-only buttons (always paired with `aria-label`, see
Accessibility below).

## Colors

Tokens come from Tailwind v4 CSS variables generated by shadcn from the **`neutral`** base color
(`app/globals.css`, `:root` / `.dark` blocks, re-exposed via the `@theme inline` block as
`--color-*` Tailwind utilities): `background`, `foreground`, `card`, `popover`, `primary`,
`secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, plus `chart-1..5` and a
`sidebar-*` group reserved for the future app shell. **Never hardcode a hex/oklch value in
component code** — always reference the Tailwind utility (`bg-primary`, `text-muted-foreground`,
`border-border`) so theming and dark mode stay centralized.

The neutral base means BalloCRM currently has **no built-in colored semantic tokens** (no
"success green" or "warning amber" in `globals.css`) — `destructive` is the only pre-defined
semantic color. Health-score and pipeline-stage status color needs to be layered on **as tokens**,
not inline hex, before Sprint 1 UI work ships. Recommended approach (record the final choice in
[decisions.md](./decisions.md) once made): add semantic status variants using existing neutral
tokens plus `destructive`/`chart-*` combinations rather than introducing new raw colors — e.g.
map health-score bands to existing `Badge` variants (`default` = healthy, `secondary` = watch,
`destructive` = at-risk) rather than inventing green/amber/red hexes, so status always resolves
correctly against both light and dark backgrounds. If a genuinely new semantic hue is required
(e.g. a distinct "won" green), add it as a new CSS variable in `app/globals.css` under both `:root`
and `.dark`, exposed via `@theme inline`, exactly like the existing tokens — never as a Tailwind
arbitrary value (`bg-[#22c55e]`) in component code.

## Dark mode

Wired via `next-themes` in `providers/app-providers.tsx` (`ThemeProvider`, class-based strategy,
`defaultTheme="system"`). `app/globals.css` defines a full `.dark` override block for every token
above, and `@custom-variant dark (&:is(.dark *))` makes Tailwind's `dark:` variant work against
that class. Component code should almost never need an explicit `dark:` class — using the
semantic tokens (`bg-card`, `text-foreground`, etc.) instead of raw Tailwind grays gets dark mode
for free. Reach for `dark:` overrides only for effects that are genuinely asymmetric between
themes (several shadcn components already do this, e.g. `button.tsx`'s `dark:bg-input/30` on the
`outline` variant) — don't reintroduce it for ordinary color needs.

## Responsive rules

Tailwind's default breakpoints apply, with `md` (768px) as the key structural breakpoint for the
future app shell (sidebar + topbar, Sprint 1 Dev 2):

- **Below `md`:** the primary nav (driven by `config/site.ts`'s `primaryNav`) collapses out of a
  persistent sidebar into a `sheet.tsx` drawer triggered by a hamburger `Button` (`variant="ghost"
size="icon"`) in the topbar. The Redux `ui-slice`'s `sidebarCollapsed` state governs the
  desktop collapsed/expanded rail, not the mobile drawer (which is simply open/closed).
- **`md` and above:** persistent left sidebar, collapsible to an icon-only rail (`sidebarCollapsed`
  from `store/slices/ui-slice.ts`).
- **Tables on narrow viewports:** prefer horizontal scroll inside a bounded container
  (`overflow-x-auto`) over collapsing columns into cards — this product is desktop-first for
  power users; mobile is "usable," not the primary optimization target.
- **Dialogs/sheets:** `dialog.tsx` content should cap at a reasonable `max-w-*` and never exceed
  the viewport width on small screens (shadcn's default already handles this); `sheet.tsx` panels
  go full-width below `sm` and a fixed width (e.g. `sm:max-w-md` or wider for edit forms) above it.

## Accessibility (WCAG 2.1 AA target)

- **Focus states:** already baked into shadcn components via `focus-visible:border-ring
focus-visible:ring-3 focus-visible:ring-ring/50` (see `button.tsx`, `badge.tsx`, `input.tsx`,
  etc.) — do not strip or override these when customizing a component.
- **Color contrast:** the `neutral` base palette's text tokens (`foreground`,
  `muted-foreground` at `oklch(0.556 0 0)` on white / `oklch(0.708 0 0)` on dark) meet AA for body
  text at `text-sm`+; when introducing a new semantic status token (see Colors), check contrast
  against both `background` and `card` in light and dark mode before shipping it, especially for
  small `Badge`/caption text.
- **Keyboard navigation:** tables must support full keyboard traversal — row actions exposed via
  `dropdown-menu.tsx` (already keyboard-operable via Radix), no click-only affordances (e.g. a
  hover-only "delete" icon with no keyboard path is not acceptable). `command.tsx` (cmdk) powers
  the command menu (`commandMenuOpen` in `ui-slice`) and must remain reachable via a documented
  keyboard shortcut once the shell ships.
- **Icon-only buttons:** every `Button` using an `icon`/`icon-sm`/`icon-xs` size with no visible
  text must have `aria-label` (e.g. `<Button size="icon" variant="ghost" aria-label="Delete
contact"><Trash2 /></Button>`) — never rely on a `title` attribute alone for accessible naming.
- **Form errors:** `field.tsx`'s `FieldError` already renders `role="alert"`; always pair it with
  `aria-invalid` on the input and `data-invalid` on the wrapping `Field` (see Forms above) so
  assistive tech and the destructive styling agree.
- **Status-only-by-color:** health-score/stage badges must never convey status by color alone —
  always pair the `Badge` with a text label (e.g. "Health 82," "At risk," "Closed Won"), never a
  bare colored dot.
