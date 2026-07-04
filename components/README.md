# components/

Shared, feature-agnostic UI only.

- `components/ui/` - shadcn/ui primitives (generated via `npx shadcn add <name>`). Do not
  hand-edit generated files beyond what's necessary; re-run the generator instead so upgrades
  stay clean.
- `components/shared/` - composed components used by 2+ features (e.g. `EntityAvatar`,
  `DataTableToolbar`, `EmptyState`). If a component is only used by one feature, it belongs in
  `features/<feature>/components/` instead.

See `docs/ui-design-system.md` for tokens, spacing, and component usage rules.
