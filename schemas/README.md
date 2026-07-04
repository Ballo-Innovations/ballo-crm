# schemas/

Zod schemas that are the single source of truth for any shape crossing a boundary: form input,
Server Action payload, Firestore document, external API (BalloAds, Brutus AI) request/response.

Naming: `<entity>-schema.ts` exporting `<entity>Schema` and `type <Entity> = z.infer<typeof
<entity>Schema>`. Feature-specific schemas live in `features/<feature>/schemas/`; only shapes
shared across features (e.g. the base `Account` shape used by both `accounts` and
`opportunities`) belong at this top level.
