# types/

Ambient/shared TypeScript types that are **not** derived from a Zod schema — e.g. third-party
type augmentation, generic utility types (`Nullable<T>`, `PaginatedResult<T>`), or the shape of
a session object attached by middleware. If a type describes data that crosses a validation
boundary (form, API, Firestore document), it belongs in `schemas/` as a Zod schema instead, with
the type inferred via `z.infer`.
