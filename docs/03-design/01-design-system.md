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

| Token       | Light     | Dark      | Use                                                     |
| ----------- | --------- | --------- | ------------------------------------------------------- |
| `--shell`   | `#FFFFFF` | `#111111` | app background, sidebar                                 |
| `--main`    | `#ECECEC` | `#1B1B1B` | the rounded content panel                               |
| `--card`    | `#FFFFFF` | `#242424` | cards, top-bar controls on the panel                    |
| `--ink`     | `#0D0D0D` | `#F5F5F5` | text, active nav, primary buttons, primary chart series |
| `--mute`    | `#6B6B6B` | `#9A9A9A` | secondary text, axis labels                             |
| `--soft`    | `#F3F3F3` | `#2E2E2E` | icon circles, table rows, neutral pills                 |
| `--line`    | `#E4E4E4` | `#333333` | borders, grid lines, row hover                          |
| `--bar2`    | `#D4D4D4` | `#505050` | unchecked controls, quiet fills (not chart series)      |
| `--chart-2` | `#7A7A7A` | `#9A9A9A` | chart: comparison series, target line, hatch stripes    |
| `--chart-3` | `#C8C8C8` | `#505050` | chart: third / remaining series                         |
| `--danger`  | `#DC2626` | `#F87171` | at-risk, lost, destructive actions only                 |

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
  Settings (routes `/dashboard` … `/settings`; ABM lives in Accounts, VSI in Forecast, CIMS admin
  in Settings). Active item = black pill with the icon in a white circle. User card at the bottom.
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

## Command palette (decided: centred palette)

Reference: option A in `docs/03-design/reference/command-options.html`. Styles and markup:
`palette` in the UI kit.

- **Opening:** ⌘K / Ctrl K from anywhere, or clicking the top-bar search pill. Opens over a 28%
  black scrim; the page stays behind it.
- **Look:** a `--card` card, 600px wide (max: window minus 32px), max 470px tall, 26px radius,
  large soft shadow, about 70px from the top of the content panel. It drops in with a 200ms
  fade and a small scale.
- **Search field:** 58px row with a search icon, 17px/500 input ("Search or type a command…")
  and an `esc` key hint on the right; a 1px divider below.
- **Results:** grouped under small uppercase headings: Actions, Opportunities, Accounts, Leads,
  Contacts. Each row: a 34px icon circle (initials for records, a symbol for actions), the title
  (14px/600) with the matched letters bold and underlined, a `--mute` subtitle ("Kariba Power
  Co. · Negotiate"), and a short detail on the right ("K6.4M · Gold 58", or the shortcut for
  actions). The highlighted row is `--soft` with a ↵ hint.
- **Empty query:** shows Recent (last opened records) and Quick actions (New lead, New
  opportunity, Go to Pipeline…).
- **Footer:** keyboard hints: ↑↓ move · ↵ open · esc close.
- **Behaviour:** results update as you type (debounced, one search endpoint, only records the
  user may see); ↑ ↓ move, Enter opens records in the drawer and runs actions, Esc or the scrim
  closes and returns focus. No results: "No results for “…”. Try a company, contact or
  action." `role="dialog"` with a combobox and listbox. On phones it opens full screen.

## Score explanation (decided: summary card + waterfall)

Reference: option D in `docs/03-design/reference/score-options.html` (use the what-if controls).
Styles and markup: `score` in the UI kit. Shown in the drawer's **Score** tab; every number comes
from the scoring service's explanation payload (`02-scoring-and-grading-spec.md`), never
computed in the UI.

1. **Summary card:** `--ink` card, 20px radius, 18px padding, `--shell` text. Score 40px/700
   with "/ 100" at 16px and 60% opacity; the grade pill on the right (inverted: `--shell` fill,
   `--ink` text). Below, one plain sentence built from the payload: the stage and its starting
   points, then the factor costing the most and its reason ("It is in **Negotiate**, which starts
   it at 75. It loses most on **committee coverage 70%** (no Technical, Procurement buyer) and 1
   other factor."). If nothing pulls it down: "Nothing is holding it back." Weighted value
   underneath at 13px, 65% opacity. A change since yesterday shows as a small "+4" chip.
2. **Where the points went:** a waterfall. Rows of label (92px, `--mute`) · track (22px,
   `--soft`, 8px radius) · points (right, 700, tabular). First row is the stage's starting
   points as a solid `--ink` bar; each factor below 1.0 is a striped segment showing the points
   it removed ("−9"); factors at 1.0 are left out; the last row is the final score in solid
   `--ink` with a bold label.
3. **Grade scale:** section title "Grade · 17 points to Platinum" (or the missing rule, e.g.
   "needs economic buyer + budget for Platinum"; "Top grade" at Platinum). Four bands
   (Bronze <35 · Silver 35–54 · Gold 55–74 · Platinum ≥75) sized to their ranges, 12px tall;
   the current grade's band is `--ink`, others `--line`; a 2px marker with a black value pill
   sits at the score.
4. **Next best actions:** up to three `--soft` rows (14px radius) with a black arrow circle,
   the action and the points it would add ("+5") on the right; clicking opens the right form.

Section titles are 12px/600 uppercase `--mute`. Bars animate their width over 400ms (none with
reduced motion). The waterfall has a text equivalent for screen readers ("Stage 75, committee
minus 9, engagement minus 8, score 58").

## Activity timeline (decided: up next + weekly log)

Reference: option F in `docs/03-design/reference/timeline-options-2.html`. Styles and markup:
`activity` in the UI kit. Shown in the drawer's **Activity** tab (and on account pages).

1. **Log box:** one `--soft` pill ("Log a note, call or meeting…") with a round black send
   button (faded until there is text). On focus it gets the `--ink` outline and shows type pills
   (Note · Call · Meeting) below. Enter logs it; the new row slides in at the top of "This
   week" and a toast confirms (meetings also show their engagement points).
2. **Up next card:** when a meeting is scheduled, a black card (22px radius, 16px padding) pins it
   above everything: "UP NEXT" label (12px uppercase, 60% opacity), a countdown pill on the
   right ("in 3 days", `--shell` fill), the title (18px/600), attendee faces (overlapping 26px
   circles) and a white "Join · Thu 26, 10:00" button. Hidden when nothing is scheduled.
3. **Engagement summary:** three `--soft` tiles (16px radius): meetings, emails and engagement
   points earned ("+48"), numbers 20px/700 tabular, labels 12px `--mute`.
4. **Weekly log:** groups titled This week · Last week · then by month (12px uppercase `--mute`).
   Each row: 34px icon circle (`--soft`; black for score-moving events: stage changes, tours,
   demos) · title (14px/600) over a one-line summary (12px `--mute`, ellipsis; stage changes read
   "Score 41 → 58") · on the right the relative time and the points pill (black, "+25") when the
   event adds engagement. Rows are 16px radius and turn `--soft` on hover, where quick actions
   appear on the right (reply, edit, delete, as 28px circles). Clicking a row expands it in place.

Newest first; full date on hover; stage and score changes are logged automatically; emails sync
in; loads 20 at a time as you scroll. Empty: "No activity yet. Log the first call or meeting."
with the log box focused.

## Contract progress and signature (decided: progress bar + status card)

Reference: option C in `docs/03-design/reference/contract-options.html` (step through it and sign).
Styles and markup: `contract` and `signature` in the UI kit.

1. **Header:** document icon tile, contract title (18px/600), "Account · contract number · from
   opportunity" (13px `--mute`), value on the right (22px/700).
2. **Progress bar:** five equal 8px pill segments with 6px gaps, labelled underneath (12px/600):
   Draft · Sent · Viewed · Signed · Active. Done segments are `--ink`; the current one is `--line`
   with an `--ink` fill that gently pulses (none with reduced motion); later ones `--line` with
   `--mute` labels. Declined or expired turns the current segment and label `--danger`.
3. **Status card:** black card (22px radius) with a 52px white icon circle, a small uppercase
   status ("VIEWED"), a plain-language headline ("Ruth has opened it twice", 20px/600), one line
   of context (13px, 75% opacity: when, reminders, start date) and the single next action as a
   white hero button on the right ("Send for signature", "Mark as viewed", "Activate contract").
4. **Details:** four `--soft` tiles: term, start, billing, owner.
5. **Signature (signing step):** Draw / Type pill tabs. Draw: a 170px `--soft` pad (20px radius)
   with a dashed signature line and ×, placeholder "Sign here with your mouse or finger", pen
   width varying with speed, and a Clear pill once inked. Type: a full-name field with a
   handwriting-font preview. Consent line underneath (12px `--mute`). "Sign contract" (hero)
   stays disabled with the hint "Add a signature to continue" until there is a signature.
6. **Signed:** the signature image with "Signed by …", date, time and IP in a `--soft` box, and
   the audit trail as small pills (Draft 20 Nov · Sent 21 Nov · …).

Every step records who and when; the signed PDF is stamped with the signature, name, time and IP.
On phones the pad fills the width and the status card's button drops below the text.

## Charts (decided: bold pills)

Reference: option B in `docs/03-design/reference/chart-options.html` (hover the charts). Styles:
`chart` in the UI kit. Built with Recharts (shadcn chart), styled as below.

- **Series colours (monochrome, validated):** `--ink` primary, `--chart-2` comparison, hatch
  (45° `--chart-2` stripes on `--card`) third, `--chart-3` the rest. These greys pass the dataviz
  validator's colour-blind and normal-vision separation in light and dark (ΔE ≈ 25). The light
  step is below 3:1 against the card, so identity is never by shade alone: always a legend for 2+
  series, direct labels on up to 4, and a "View as table" option.
- **Bars:** fat pills, 22px thick, fully rounded ends, 2px gaps between bars and segments; the
  highlighted bar is `--ink`, others `--chart-2`/`--chart-3`.
- **Lines:** 3px `--ink`, round joins, a 9px dot on every point with a 2px `--card` ring; target or
  comparison lines are 2px `--chart-2`, dashed 6/5. The latest value is labelled at the line's end.
- **Donut:** 34px-thick ring with 3px `--card` gaps between segments, total in the centre (22px/700)
  with a `--mute` caption; legend beside it with values.
- **Funnel:** stacked pills, 30px tall, width by value (minimum 18%), value inside right-aligned,
  the last step (Won) `--ink` with white text, conversion from the previous step on the right.
- **Progress vs target:** a 54px pill track (`--soft`) with stacked segments and a 2px `--ink`
  quota marker at the end; legend underneath with the % of quota.
- **Axes and grid:** dashed 2/4 `--line` grid, 11px `--mute` labels, one y-axis only (never two),
  money in compact kwacha (K4.2M).
- **Hover:** a black tooltip pill (14px radius) with the label in bold and exact values; line
  charts add a faint vertical crosshair. Hit areas are wider than the marks.
- **Card:** chart title 18px/600 with a `--mute` subtitle, optional hero number on the right
  (28px/700) with a small change note.
- Animations grow bars and lines once on load (300ms), none with reduced motion.

## Avatars and logos (decided: grey circles for everything)

Reference: option A in `docs/03-design/reference/avatar-options.html`. Styles: `avatar` in the UI
kit.

- **Everyone** (contacts, users and accounts): circles, `--soft` fill, `--ink` initials. People and
  companies look the same on purpose; the name or row next to the avatar says which it is.
- **Logos:** an uploaded company logo shown in monochrome (grayscale) in a `--card` circle with a
  1px `--line` ring and 16% padding.
- **Initials:** first letters of the first two words ("Kariba Power Co." → KP, "Ruth Phiri" → RP),
  700 weight at 38% of the size.
- **Sizes:** 24 (inline, stacks in tables) · 32 (lists, stacks) · 40 (cards) · 48–56 (drawer and
  page headers).
- **Online:** a black dot (28% of the size, min 8px) with a 2px `--card` ring, bottom right; users
  only.
- **Stacks:** overlap by 10px with a 2px `--card` ring; at most 3, then a black "+N" circle.
- Every avatar has the full name as its accessible label and tooltip. Inside a row on `--soft`,
  circles switch to `--card` so they stay visible.

## Accessibility (rules)

Target: WCAG 2.2 AA on every screen, checked with axe in CI and by hand with a keyboard.

- **Contrast:** body text ≥ 4.5:1, large text (≥ 18px or 14px bold) and UI parts ≥ 3:1, in light and
  dark. `--mute` is for secondary text only, never for anything a user must read to act. Greys
  below 3:1 (`--line`, `--chart-3`) are never the only way to tell things apart.
- **Never colour alone:** grades have their name on the pill, status has an icon and a word,
  `--danger` always comes with text ("At risk"), charts have legends, labels and a table view.
- **Keyboard:** everything clickable is reachable with Tab in reading order and works with Enter
  or Space. Composite widgets use arrow keys (tabs, menus, the palette, the Kanban board). Esc
  closes the top layer. ⌘K works everywhere. A "Skip to content" link is the first Tab stop.
- **Focus:** a 2px `--ink` outline with 3px offset on `:focus-visible`, never removed. Focus moves
  into drawers, modals and the palette when they open and returns to the opener when they close;
  modals trap focus.
- **Targets:** at least 44×44px on touch (small buttons get a larger hit area), 24×24px minimum on
  desktop, with 8px between adjacent targets.
- **Semantics:** real `<button>` and `<a>` elements; one `<h1>` per page and headings in order;
  landmarks (`nav`, `main`, `aside` for the drawer); every icon-only button has an `aria-label`;
  every input has a visible label (the floating label counts) tied with `for`/`id`; errors are
  linked with `aria-describedby`.
- **Announcements:** toasts use `role="status"` (errors `role="alert"`); live counts ("6 of 9")
  and drag-and-drop moves are announced; loading regions set `aria-busy`.
- **Zoom and text:** usable at 200% zoom and 320px wide with no sideways scrolling; text sizes in
  rem so browser font settings apply; nothing important in images of text.
- **Avatars and charts:** avatars carry the full name as their label; every chart has an
  `aria-label` summary and a "View as table" toggle.

## Motion (rules)

- **Purpose:** motion explains a change (something opened, moved or updated), never decorates.
- **Durations:** 150ms for hovers and small state changes (`--t-fast`), 220ms for things that
  appear (`--t-base`: menus, modals, fades), 300ms for things that travel (`--t-slow`: drawer,
  sidebar, bars growing). Nothing longer than 600ms (the loading unblur is the only exception).
- **Easing:** `--ease` (cubic-bezier(0.2, 0.8, 0.2, 1)) for entering and moving; a plain ease-out
  for leaving, about 20% faster than entering.
- **What moves:** opacity and transform only (no animating width/height of large areas except
  the docked drawer); small scales (97% → 100%) and short slides (≤ 20px).
- **Feedback:** buttons scale to 97% when pressed; cards lift 2–3px on hover; new list items slide
  in 6–8px; changed numbers do not count up (they just update, with a "+4" chip when useful).
- **Reduced motion:** with `prefers-reduced-motion: reduce`, durations drop to 0, nothing pulses
  or loops, and fades replace slides. The UI must work exactly the same without motion.
- **Never:** parallax, auto-playing carousels, flashing (more than 3 per second), or motion that
  blocks input.

## Numbers, dates and text (rules)

The app is for Zambia: English (UK spelling), Zambian kwacha, Central Africa Time.

- **Money:** kwacha with a "K" and no space, comma thousands: **K6,400,000**. Compact in KPIs,
  cards and charts: **K6.4M**, **K450K**, **K1.2B** (one decimal, dropped when .0 is not useful).
  Exact value in tooltips and drawers. Negative: **−K12,000** (true minus sign). No currency
  code in the UI unless several currencies appear (then "ZMW 6,400,000"). Use `formatZMW` /
  `formatZMWCompact`; never format by hand.
- **Numbers:** comma thousands, full stop decimals (12,480.5); tabular figures wherever numbers
  line up; counts under 10,000 in full.
- **Percentages:** whole numbers by default (75%), one decimal only when it matters (5.1%);
  changes with a sign: **+18%**, **−4%**; percentage points as "pts" (+3 pts).
- **Scores:** whole numbers 0–100, shown as "58" or "58 / 100" with the grade ("Gold · 58").
- **Dates:** day month year, month as a short word: **23 Nov 2026**; same year may drop the year in
  tight spaces (**23 Nov**); with weekday: **Thu 26 Nov**. Never 11/23/2026 or 23/11/2026 in the UI
  (ambiguous). ISO 8601 (2026-11-23) only in exports and the API.
- **Times:** 24-hour, **10:42**; with a date: **23 Nov 2026, 10:42**. Stored in UTC, shown in the
  user's time zone (default Africa/Lusaka, CAT, UTC+2); show the zone only when it differs.
- **Relative times:** for recent activity: "just now" (< 1 min), "5 min ago", "3h ago", "1d ago" up
  to 7 days, then the date. Future: "in 3 days". The exact date and time is always in the tooltip.
- **Ranges:** en dash with no spaces: 1–7 Dec 2026, K1M–K5M, 15–30 days.
- **Phone numbers:** stored as E.164, shown as **+260 97 123 4567**.
- **Text:** sentence case for everything (titles, buttons, menus, column headers); buttons say the
  action ("Mark as lost", not "OK"); numbers as digits in the UI ("3 deals"); truncate with an
  ellipsis and show the full text in a tooltip.

## Components (shadcn, restyled to the above)

KpiCard (icon circle, big number, two-line label; one may be highlighted with a black icon and
a ↗ link) · Card · DataTable (separated rounded `--soft` rows, checkbox column, ⋯ row menu,
pill filters, black Export) · Badge(grade) · Pill(status/stage) · ScoreRing(0–100) ·
FactorList(explanation) · RecommendationCard / NextBestAction row (avatar circle, title, action ·
stage, grade pill) · Charts (bold pills, see Charts) · KanbanBoard(dnd-kit) · Timeline · CommitteeMap · WhitespaceMatrix · InsightRow ·
ContractStatusStepper · SignaturePad.

## Micro-rules

- Every empty state has a CTA.
- Every number with a computation has an ⓘ → drawer.
- Loading = blurred placeholder content with the loader pill (see Page states).
- Toast on every write, with undo where cheap.
- Hover states on everything clickable (soft background or a 3px lift on cards).
- Check every screen at desktop and 390px, in light and dark.
