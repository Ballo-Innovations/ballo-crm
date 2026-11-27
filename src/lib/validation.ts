import { z } from "zod";

import { AppError, type AppErrorCode } from "./errors";

/**
 * Turns zod errors into what the UI and the API show. Server actions call `parseInput`
 * (step two of "requireRole -> zod parse -> withAudit"); API routes return `errorResponse`,
 * shaped `{ error: { code, message, fields? } }` (docs/02-architecture/03-api-spec.md).
 */

export type FieldErrors = Record<string, string>;

/** The form-level key, for errors that belong to no single field. */
export const FORM_KEY = "_form";

const CHECK_FIELDS = "Check the highlighted fields.";
const INTERNAL_MESSAGE = "Something went wrong. Try again.";

/** First message per field; nested paths are dotted ("address.city", "tags.1"). */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : FORM_KEY;
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** A VALIDATION AppError carrying the field messages. */
export function validationError(error: z.ZodError): AppError {
  const fields = fieldErrors(error);
  const onlyForm = Object.keys(fields).length === 1 && FORM_KEY in fields;
  return new AppError("VALIDATION", onlyForm ? fields[FORM_KEY] : CHECK_FIELDS, fields);
}

/** Parses input with the schema, or throws a VALIDATION AppError. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw validationError(result.error);
}

const STATUS: Record<AppErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export type ErrorBody = { error: { code: AppErrorCode; message: string; fields?: FieldErrors } };

/**
 * HTTP status and body for any thrown value. Unexpected errors become INTERNAL with a generic
 * message, so database or stack details never reach the client; the caller logs the original.
 */
export function errorResponse(err: unknown): { status: number; body: ErrorBody } {
  const appError =
    err instanceof AppError
      ? err
      : err instanceof z.ZodError
        ? validationError(err)
        : new AppError("INTERNAL", INTERNAL_MESSAGE);
  const { code, message, fields } = appError;
  return {
    status: STATUS[code],
    body: { error: fields ? { code, message, fields } : { code, message } },
  };
}
