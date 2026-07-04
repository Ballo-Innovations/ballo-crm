# features/

Feature-based domain code. Each business capability gets its own self-contained folder:

```
features/
  accounts/
    components/       # feature-scoped UI (not shared elsewhere)
    hooks/             # feature-scoped hooks (TanStack Query wrappers, local state)
    schemas/           # Zod schemas for this feature's data shapes
    actions/           # Server Actions for this feature
    types.ts           # types derived from schemas or feature-local types
```

Rules:

- A feature folder never imports from another feature folder directly. Shared logic goes in
  `lib/`, `services/`, or top-level `components/`.
- UI never talks to Firestore directly - it calls an action in `actions/`, which calls a
  `services/` function, which calls a `repositories/` function.
- Keep files small. If a feature's `components/` folder exceeds ~10 files, split by sub-domain
  (e.g. `accounts/components/list/`, `accounts/components/detail/`).

See `docs/folder-structure.md` and `docs/coding-standards.md` for the full convention set.
