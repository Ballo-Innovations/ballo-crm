# actions/

Thin Server Action entry points (`"use server"`) that feature UI imports directly. An action:

1. Parses/validates `FormData` or arguments with a Zod schema from `schemas/`.
2. Calls a `services/` function.
3. Returns a typed result (`{ ok: true, data }` or `{ ok: false, error }`) - never throws to the
   client for expected validation/business errors.

Cross-cutting actions live here; feature-specific actions live inside
`features/<feature>/actions/` instead and are only promoted here if more than one feature needs
them.
