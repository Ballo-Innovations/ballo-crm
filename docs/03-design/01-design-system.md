# Design System — BalloCRM

**Reference build:** `docs/03-design/reference/dashboard-concept.html` (open it in a browser) and
the screenshots beside it. When this doc and the reference disagree, the reference wins; raise it
so the doc gets fixed. Every new screen must look like it belongs next to that dashboard.

## Principles

Monochrome, soft and calm. Black, white and greys do the work; colour is rare and always means
something. Big rounded shapes, generous spacing, one strong black element per area to draw the
eye (the active nav pill, the highlighted KPI, the primary button). No gradients, no drop
shadows except a faint lift on hover.

## Tokens (Tailwind / CSS variables)

Light is the default; dark is a toggle in the top bar and follows `prefers-color-scheme`.

| Token      | Light     | Dark      | Use                                                     |
| ---------- | --------- | --------- | ------------------------------------------------------- |
| `--shell`  | `#FFFFFF` | `#111111` | app background, sidebar                                 |
| `--main`   | `#ECECEC` | `#1B1B1B` | the rounded content panel                               |
| `--card`   | `#FFFFFF` | `#242424` | cards, top-bar controls on the panel                    |
| `--ink`    | `#0D0D0D` | `#F5F5F5` | text, active nav, primary buttons, primary chart series |
| `--mute`   | `#6B6B6B` | `#9A9A9A` | secondary text, axis labels                             |
| `--soft`   | `#F3F3F3` | `#2E2E2E` | icon circles, table rows, neutral pills                 |
| `--line`   | `#E4E4E4` | `#333333` | borders, grid lines, row hover                          |
| `--bar2`   | `#D4D4D4` | `#505050` | secondary chart series                                  |
| `--danger` | `#DC2626` | `#F87171` | at-risk, lost, destructive actions only                 |

Semantic colour (`--danger`, and green/amber if ever needed) is used for small marks only: a dot,
an icon, a thin badge border. Never for large fills.

**Grades** are monochrome pills that always show the label and score ("Gold · 58"), so they
never rely on colour: Platinum and Gold = solid `--ink` pill; Silver and Bronze = `--soft` pill
with a `--line` border.

## Typography

Urbanist (Google Fonts), weights 400/500/600/700. Page title 26px/600, card titles 22px/600,
KPI numbers 24px/700, body 15px, secondary 13px, labels 12px. Money right-aligned with
`tabular-nums`, formatted with `formatZMW` (K6,400,000; compact K6.4M in KPIs and charts).

## Shape and spacing

- Radii: content panel 32px · cards 28px · KPI cards 26px · table rows 16px · inputs and
  buttons 14–16px · pills, nav items, icon buttons fully round.
- Icons: 1.5–2px stroke line icons (lucide), 17px, sitting in a 36–46px `--soft` circle.
- Card padding 26px, gaps 16–22px. Phone: card padding 18px, gaps 10–14px.

## Layout

- **Sidebar** (248px, collapsible to 84px icon rail via a round chevron button by the logo):
  Dashboard · Pipeline · Accounts · Leads · Forecast · Engagement · Contracts · Intelligence ·
  Settings. Active item = black pill with the icon in a white circle. User card at the bottom.
  Target (ABM) accounts live under Accounts as a tab, not a nav item.
- **Content panel**: one `--main` rounded panel with a 16px gap from the top, right and bottom
  edges of the window. The page never scrolls; the panel scrolls inside itself, so its edges
  stay visible.
- **Top bar** sits inside the panel, pinned above the scrolling content: search (⌘K) on the
  left; Quick add (black), notifications, theme toggle and user menu on the right. Controls are
  `--card` on the grey panel.
- **Detail views** open in the right-side Drawer, never a new page (see Drawer below).
- **Phone (≤720px)**: sidebar becomes a slide-in drawer with a scrim (menu button top left);
  top bar is menu · logo · round icon buttons, with search on its own full-width row; KPIs in a
  2-column grid; tables turn into stacked cards; no horizontal page scroll.

## Drawer (decided: docked side panel)

Reference: option B in `docs/03-design/reference/drawer-options.html` (click a row to open it).

- **Docked, not overlaid.** The drawer opens as a 400px white `--card` column inside the grey
  content panel, with a 22px radius and a 16px gap from the list. The list shrinks to make room;
  there is no scrim and the page behind stays usable.
- **Row to row.** Clicking another row swaps the drawer's content in place; the open row keeps a
  2px `--ink` outline. Tables in a docked state hide their lowest-priority columns rather than
  scroll sideways.
- **Structure:** header (avatar circle, title, "Account · Type" subtitle, ⋯ menu, ✕) · tabs
  with a 2px `--ink` underline on the active tab · scrolling body · sticky footer with actions
  (outline secondary on the left, black primary on the right).
- **Opening and closing:** width animates 0 → 400px in 300ms `cubic-bezier(.2,.8,.2,1)`.
  Closes with ✕ or Esc. Focus moves into the drawer on open and back to the row on close.
- **Deep link:** the open record is in the URL (`?open=<id>`) so a drawer can be shared or
  reloaded.
- **Phone (≤720px):** the drawer covers the whole content panel and slides in from the right;
  ✕ returns to the list.
- **Destructive or blocking actions** started from a drawer (Mark as lost, Delete) open a
  confirm modal, not another drawer.

## Forms (decided: pill fields, label floats up and out)

Reference: option C in `docs/03-design/reference/form-options.html` (click into the fields).

- **Field:** fully rounded pill, 50px tall, `--soft` fill, no border, 18px side padding, 15px
  text. Textareas use the same fill with a 22px radius.
- **Label:** sits inside the empty pill as the placeholder (15px, `--mute`). On focus or when
  the field has a value it moves up and out to sit above the pill, 8px from its left edge
  (13px/600, `--ink`), animated over 180ms. Every field reserves 22px above it for the label so
  nothing shifts when it floats.
- **Always-up labels:** fields with a prefix (`+260`, `K`), selects and date pickers keep the
  label above at all times.
- **Placeholder / hint text** shows inside the pill only once it is focused (e.g. "e.g. Zambeef
  Products").
- **Focus:** pill turns `--card` with a 1.5px `--ink` border.
- **Error:** 1.5px `--danger` border, label turns `--danger`, a message with an ⓘ icon below
  (12px), replacing the help text. Validate on submit and on blur once the field has been
  touched; on submit, focus the first invalid field and toast "Fix the highlighted fields".
- **Disabled:** 50% opacity.
- **Help text:** 12px `--mute`, below the pill, indented 18px to line up with the text.
- **Optional fields** say "(optional)" in the label; required ones have no marker.
- **Money:** `K` prefix, digits only, formatted with thousands separators as you type, stored
  as integer ngwee. **Phone:** `+260` prefix, grouped `97 123 4567`.
- **Choice controls:** multi-select chips (soft pill, black when selected), 20px rounded
  checkbox (black when checked), black switch. Two related short fields may share a row; on
  phones every field is full width.
- **Submit button** shows a busy label ("Creating…") and is disabled while saving; success
  shows a toast.

## Buttons (decided: pills, with an icon-circle hero)

Reference: option D in `docs/03-design/reference/button-options.html`.

- **Shape:** every button is a fully rounded pill. Heights 34 / 44 / 52px (sm / md / lg), side
  padding 14 / 20 / 26px, 600 weight, 13 / 14 / 15px text, 16px icon before the label (a
  trailing chevron for dropdown triggers). Medium is the default; large for phone footers and
  empty states.
- **Variants:**
  - **Hero:** black pill with the icon in a white circle on the left (like the active nav item);
    the circle tilts slightly on hover. **At most one per area** (top bar, page header, drawer
    footer, empty state) for the main thing to do there: Quick add, Add lead, Create, Advance
    stage.
  - **Primary:** black pill. Save, Export, Confirm.
  - **Secondary:** outline pill (1.5px `--ink`), transparent fill. Cancel, Stage filter.
  - **Tertiary:** `--soft` fill, no border. Filters and toggles on white cards.
  - **Ghost:** no fill until hover. Inline and low-emphasis actions.
  - **Destructive:** the outlined red pill starts a destructive action (Mark as lost, Delete);
    the solid red pill appears only inside the confirm dialog.
- **Icon buttons:** round, same heights; `--soft` fill by default, black for the main one
  (Quick add on phones). Always have an `aria-label` and tooltip. Notification dot top right.
- **Split button:** black pill with a divider and a chevron segment for alternatives.
- **States:** hover darkens or adds a soft fill; press scales to 97%; focus shows a 2px `--ink`
  ring 3px out; disabled is 40% opacity with a not-allowed cursor; loading keeps the button's
  width, swaps the icon for a spinner and blocks repeat clicks.
- **Placement:** in footers the secondary or destructive action sits left and the hero or
  primary sits right.

## Components (shadcn, restyled to the above)

KpiCard (icon circle, big number, two-line label; one may be highlighted with a black icon and
a ↗ link) · Card · DataTable (separated rounded `--soft` rows, checkbox column, ⋯ row menu,
pill filters, black Export) · Badge(grade) · Pill(status/stage) · ScoreRing(0–100) ·
FactorList(explanation) · RecommendationCard / NextBestAction row (avatar circle, title, action ·
stage, grade pill) · BarChart (rounded thin bars, `--ink` vs `--bar2`, dashed grid, black tooltip
pill) · KanbanBoard(dnd-kit) · Timeline · CommitteeMap · WhitespaceMatrix · InsightRow ·
ContractStatusStepper · SignaturePad.

## Micro-rules

- Every empty state has a CTA.
- Every number with a computation has an ⓘ → drawer.
- Loading = skeletons in the same rounded shapes, not spinners.
- Toast on every write, with undo where cheap.
- Hover states on everything clickable (soft background or a 3px lift on cards).
- Check every screen at desktop and 390px, in light and dark.
