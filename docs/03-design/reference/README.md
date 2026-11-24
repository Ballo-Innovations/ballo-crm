# Design reference

Which file to trust, in order:

1. **`kit/`**: the decided designs as code (tokens, component CSS, live showcase). Source of
   truth for how things look.
2. **`../01-design-system.md`**: the written rules (when to use what, copy, accessibility).
3. **`page-states.html`**: the decided loading, empty, no-results and error states.
4. **`dashboard-concept.html`** and the `dashboard-*.png` screenshots: the dashboard _layout_
   (what goes where). It predates the later decisions, so for component details (avatars,
   toasts, buttons, menus) the kit wins.
5. **`*-options.html`**: the record of each decision. They contain **rejected** designs; never
   copy from them.
