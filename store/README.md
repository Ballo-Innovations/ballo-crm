# store/

Redux Toolkit is for cross-cutting **client UI state** only (sidebar/collapse state, global
dialogs, command menu) - see `store/slices/ui-slice.ts` for the pattern. Server data (accounts,
opportunities, contracts, etc.) is owned by TanStack Query, not Redux. If you're about to put
fetched data in a Redux slice, it belongs in a `features/<feature>/hooks/use-*-query.ts` instead.

`store/store.ts` builds one store instance per request via `makeStore()` (never a module-level
singleton - that would leak state across requests on the server). `store/hooks.ts` exports the
typed `useAppDispatch`/`useAppSelector` hooks.
