export type AppErrorCode =
  "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";

/**
 * Typed application error. Server actions surface it as a toast; API routes
 * return it as `{ error: { code, message } }` (docs/02-architecture/03-api-spec.md).
 * VALIDATION errors may carry per-field messages (`src/lib/validation.ts`).
 */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
