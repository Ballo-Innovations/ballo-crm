# Design System — BalloCRM

**Reference build:** `docs/03-design/reference/dashboard-concept.html` (open it in a browser) and
the screenshots beside it. When this doc and the reference disagree, the reference wins; raise it
so the doc gets fixed. Every new screen must look like it belongs next to that dashboard.

**Code:** the UI kit in `docs/03-design/reference/kit/` holds the decided designs as CSS
(`tokens.css`, `components.css`), a live showcase (`components.html`) and the mapping to the
app's shadcn variables (`README.md`). Coding agents build from the kit.

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
- **Structure:** header (avatar circle, title, "Account · Type" subtitle, ⋯ menu, ✕) · pill
  tabs (see Tabs and segmented controls) · scrolling body · sticky footer with actions
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
- **Placeholder / hint text** shows inside the pill only once it is focused (e.g. "e.g. Kafue Valley
  Foods").
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

## Toasts (decided: black pill, bottom centre)

Reference: option A in `docs/03-design/reference/toast-options.html` (press the buttons).

- **Look:** black `--ink` pill, `--shell` text 14px/500, one line. Left: a 28px icon circle
  (white with a black check for success, red with a white ⓘ for errors, a spinner while
  loading). Right: optional action as a translucent pill (Undo, Retry, Download) and a faint ✕.
- **Position:** bottom centre of the window, 22px up; newest at the bottom, up to 3 stacked
  with 8px gaps (the oldest leaves first). On phones it spans the width minus 14px each side
  and may wrap to two lines.
- **Motion:** rises 20px and fades in over 320ms; drops and fades out over 250ms.
- **Timing:** success 4s; with Undo 6s; errors stay until dismissed; loading stays until it
  resolves and then turns into the success or error toast in place. Hover pauses the timer.
- **When:** every successful write (with Undo where it's cheap), background work (export,
  import), and recoverable errors. Not for validation errors (those sit on the field) and never
  for anything the user must decide (use a confirm dialog).
- **Copy:** past tense, specific, short: "Lead saved", "Moved to Negotiate", "Couldn't save
  changes". Undo turns the toast into "Change undone".
- **Accessibility:** container is a labelled region; toasts use `role="status"`, errors
  `role="alert"`; the action is keyboard-reachable.

## Empty, loading and error states (decided)

Reference: `docs/03-design/reference/page-states.html` (the consolidated page; switch between
the five states). The options considered are in `states-options.html`. Every list and page has
all five: loaded, loading, empty, no results, error.

- **Loading:** the content area (KPI cards and rows) shows generic placeholder content blurred
  (`blur(7px)`, greyscale, 50% opacity) with the black loader pill centred on top: a white
  circle with a spinner and a short message ("Loading leads…"). The page header, search and
  buttons stay sharp and usable. When the data arrives the pill fades and the content sharpens
  into focus over 600ms. Show nothing for the first 300ms so fast loads never flash, reserve
  the real layout so nothing jumps, and drop the motion when the user prefers reduced motion.
  Spinners appear only inside the loader pill and in loading buttons, never on their own.
- **Empty (first use):** the page never goes blank. Show 3–4 example rows behind the message,
  **blurred** (`blur(5px)`, greyscale, ~55% opacity, fading out downwards) so there is no
  readable text, only a hint of what will appear. Centred on top: title ("Your leads will
  appear here"), one helpful line, and the actions (hero button + secondary, e.g. Add lead ·
  Import CSV). The message sits on a solid `--card` patch that fades into the rows (box-shadow
  glow of about 44px blur / 36px spread) so it stays readable.
- **No results (search or filters):** the illustrated style. A small monochrome illustration
  built from three stacked card shapes with a round badge (white with a search icon), title
  "No leads match", a line naming the search, and a Clear search button. The active search or
  filter also shows as a removable black chip above the list.
- **Error:** the illustrated style with a red-tinted card and a red ⓘ badge, title "Couldn't
  load leads", a reassuring line ("Your data is safe — try again in a moment"), a black Retry
  button and a ghost Contact support button. KPI values show "—".
- **Copy:** say what the thing is and what to do next; no blame, no jargon, no raw error
  codes in the message.

## Modals and confirm dialogs (decided: centred card)

Reference: option A in `docs/03-design/reference/modal-options.html` (use the drawer buttons).

- **When:** only for decisions that must be made before continuing: destructive actions (Mark
  as lost, Delete), discarding unsaved changes, and app-wide confirmations (sign out). Viewing
  and editing records always happens in the drawer, never in a modal.
- **Look:** a `--card` card centred in the window, 440px wide (max: window minus 32px), 28px
  radius, 24px padding, large soft shadow, over a 32% black scrim. Top to bottom: a 48px icon
  circle (`--soft`, or red-tinted with a red icon for destructive actions), the title as one
  question (20px/600), one line saying the consequence (14px `--mute`), any inputs, then the
  actions. A round ✕ sits in the top right corner.
- **Actions:** safe choice on the left as an outline pill (Cancel, Keep editing); the action on
  the right named for what it does ("Mark as lost", "Delete", "Discard"), never "OK". Solid red
  only for destructive actions, black otherwise. On phones the card spans the width minus 12px
  each side and the buttons stack full width with the action on top.
- **Inputs inside:** use the form styles. Mark as lost requires a reason (chips: Price, Chose a
  competitor, No budget, Timing, No decision, Other) and takes an optional note; the action is
  blocked with an inline error until a reason is picked. Permanent deletes require typing the
  record's name; the Delete button stays disabled until it matches.
- **Motion:** fades in and scales from 97% to 100% over 220ms; the scrim fades over 220ms.
- **Behaviour:** focus moves into the dialog (first input, else Cancel) and returns to the
  button that opened it; focus stays inside while open; Esc, ✕ and clicking the scrim cancel,
  except while saving. The action shows a spinner and blocks repeat clicks, then the dialog
  closes and a toast confirms (with Undo where the action can be reversed, e.g. Mark as lost).
  `role="dialog"`, `aria-modal="true"`, labelled by the title.

## Tabs and segmented controls (decided: pills everywhere)

Reference: option B in `docs/03-design/reference/tabs-options.html` (click the tabs).

- **Tabs** switch between sections of the same thing (All accounts | Target accounts; the
  drawer's Overview · Score · Activity · Contacts). **Segmented controls** switch how you view
  it (Board | List; 7D · 30D · QTR · YTD). Both use the same pill style.
- **Look:** each option is its own pill with a 6px gap: `--soft` fill, `--ink` text 14px/500,
  8px × 16px padding (segmented: 7px × 13px); hover `--line`. The selected pill turns `--ink`
  with `--shell` text, like the active nav item.
- **Counts:** a small pill inside the tab (12px/600); on the selected tab it becomes translucent
  white.
- **Icon options** (Board | List): icon before the label; the selected one shows its icon in a
  white circle, like the hero button.
- **Placement:** page-level tabs sit under the page or card title; segmented controls sit at the
  right of a card header.
- **Behaviour:** the selected tab is in the URL (`?tab=target`) so it survives reloads and can
  be shared. Keyboard: ← → move and select, Home/End jump to the ends; `role="tablist"` /
  `role="tab"` with `aria-selected` and roving tabindex. On phones a row scrolls sideways
  rather than wrapping. Never more than 6 options in a row; content swaps with a short fade.

## Pipeline board (decided: compact cards)

Reference: option A in `docs/03-design/reference/kanban-options.html` (drag the cards). Styles
and markup: `kanban` in the UI kit.

- **Columns** are the scoring stages: Qualify · Discover · Propose · Negotiate. Each column is a
  22px-radius area tinted `--card` at 35% on the grey panel, 240px minimum width, 12px gaps.
- **Column header:** stage name (15px/600) with the count in a small white pill; on the right
  the total and weighted total (`K3.0M · w K305K`, 12px `--mute`, tabular numbers). Under it a
  4px bar showing the stage's share of the whole pipeline value (`--ink` on `--line`).
- **Card:** `--card`, 18px radius, 12px × 14px padding: opportunity name (14px/600), account
  (12px `--mute`), then the grade pill on the left and the value (14px/700, `formatZMW`
  compact) on the right. Hover lifts 2px with a soft shadow. Clicking opens the drawer.
- **Dragging:** the card being dragged fades to 35%; the target column shows a 2px dashed
  `--ink` outline. On drop, totals update and a toast says "Moved to Propose" with Undo.
  Keyboard: focus a card and press ← → to move it a stage (dnd-kit keyboard sensor), announced
  to screen readers.
- **Won and Lost** are not columns: close a deal from the drawer, or by dropping on a Won/Lost
  zone that appears at the bottom of the board while dragging. Both confirm first; Lost needs a
  reason (see Modals).
- **Add opportunity:** a dashed pill at the foot of each column that opens the create form in
  the drawer with the stage preset.
- **Phone:** columns are 82% wide and snap one at a time; swipe between stages.

## Filter bar and menus (decided)

References: option B in `docs/03-design/reference/filter-options.html` (layout and Filters
panel) and option V1 in `view-menu-options.html` (the View menu). Styles and markup: `filterbar`
and `menu` in the UI kit.

- **Layout (one row above every list):** View menu trigger · search pill · Filters pill · space ·
  result count ("6 of 9", 13px `--mute`). Active filters show as a second row of black chips
  ("Grade: Gold ✕"), one chip per value, ending with a "Clear all" text link.
- **Filters pill:** `--soft` pill with a filter icon; when anything is set it turns black with a
  white count pill. It opens a **panel** (24px radius, `--card`, soft shadow) with one column per
  filter (Stage, Grade, Owner, Close month), each a short checklist using the kit checkbox.
  Filters apply live. Values combine with OR within a filter and AND across filters.
- **View menu trigger:** `--soft` pill reading "View: All deals ⌄" ("View:" in `--mute`); shows
  "(edited)" after the filters of a saved view change.
- **Menus (decided: simple list)** — used for the View menu, the ⋯ row menu and the user menu:
  a `--card` popover, 24px radius, 8px padding, 1px `--line` border, soft shadow, about 280px
  wide, opening 8px below its trigger with a short fade and scale. Items are full-width rows
  (10px × 12px, 16px radius, 14px/500) that turn `--soft` on hover or keyboard focus. The
  selected item gets a ✓ in a fixed 18px column on the left and bold text; counts sit right
  aligned in `--mute`. A 1px divider separates the actions at the bottom: "Manage views", or
  when edited, "Save as new view" and "Update “…”". Destructive items are red text.
- **Behaviour:** ↑ ↓ move between items, Enter picks, Esc closes and returns focus to the
  trigger; clicking outside closes. `role="menu"` with `menuitemradio` for views. The current
  view and the filters live in the URL so a list can be shared. Saved views are per user, plus
  read-only team views. On phones menus and the Filters panel open as bottom sheets.
- **No results** uses the illustrated state with "Clear all filters".

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
- Loading = blurred placeholder content with the loader pill (see Page states).
- Toast on every write, with undo where cheap.
- Hover states on everything clickable (soft background or a 3px lift on cards).
- Check every screen at desktop and 390px, in light and dark.
