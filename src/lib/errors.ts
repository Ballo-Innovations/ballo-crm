export type AppErrorCode =
  "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";

/**
 * Typed application error. Server actions surface it as a toast; API routes
 * return it as `{ error: { code, message } }` (docs/02-architecture/03-api-spec.md).
 */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
