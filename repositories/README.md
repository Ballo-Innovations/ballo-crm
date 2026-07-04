# repositories/

The **only** layer allowed to import `firebase/firestore` or `firebase-admin/firestore`
directly. One file per Firestore collection (e.g. `accounts-repository.ts`,
`opportunities-repository.ts`), exporting plain functions (`getAccountById`, `listAccounts`,
`createAccount`, ...) that take/return typed data (Zod-inferred types from `schemas/`).

Repositories know nothing about business rules - no validation beyond shape, no side effects
beyond the read/write itself. Business rules live in `services/`.

See `docs/database-schema.md` for the collection list this layer maps to.
