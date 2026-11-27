import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "./errors";
import { errorResponse, fieldErrors, parseInput } from "./validation";

// Error shape: docs/02-architecture/03-api-spec.md, `{ error: { code, message } }`.

const schema = z.object({
  name: z.string().min(1, "Enter a name."),
  email: z.email("Enter a valid email."),
  address: z.object({ city: z.string().min(1, "Enter a city.") }),
  tags: z.array(z.string().min(2, "Tags need 2 letters.")),
});

const bad = { name: "", email: "x", address: { city: "" }, tags: ["ok", "a"] };

describe("fieldErrors", () => {
  it("gives the first message for each field, with nested paths dotted", () => {
    const result = schema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({
      name: "Enter a name.",
      email: "Enter a valid email.",
      "address.city": "Enter a city.",
      "tags.1": "Tags need 2 letters.",
    });
  });

  it("puts errors about the whole form under _form", () => {
    const range = z
      .object({ from: z.number(), to: z.number() })
      .refine((v) => v.to >= v.from, "End must be after start.");
    const result = range.safeParse({ from: 5, to: 1 });
    expect(fieldErrors(result.error!)).toEqual({ _form: "End must be after start." });
  });

  it("keeps only the first message when a field fails twice", () => {
    const twice = z.object({
      code: z.string().min(3, "Too short.").regex(/^\d+$/, "Digits only."),
    });
    expect(fieldErrors(twice.safeParse({ code: "a" }).error!)).toEqual({ code: "Too short." });
  });
});

describe("parseInput", () => {
  it("returns the parsed data when the input is valid", () => {
    const good = {
      name: "Kariba Power Co.",
      email: "a@b.co",
      address: { city: "Lusaka" },
      tags: [],
    };
    expect(parseInput(schema, good)).toEqual(good);
  });

  it("throws a VALIDATION AppError that carries the field messages", () => {
    let thrown: unknown;
    try {
      parseInput(schema, bad);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AppError);
    const err = thrown as AppError;
    expect(err.code).toBe("VALIDATION");
    expect(err.message).toBe("Check the highlighted fields.");
    expect(err.fields).toMatchObject({ name: "Enter a name.", "address.city": "Enter a city." });
  });

  it("uses the form-level message when no single field is at fault", () => {
    const range = z
      .object({ from: z.number(), to: z.number() })
      .refine((v) => v.to >= v.from, "End must be after start.");
    expect(() => parseInput(range, { from: 5, to: 1 })).toThrow("End must be after start.");
  });
});

describe("errorResponse", () => {
  it.each([
    ["VALIDATION", 400],
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["CONFLICT", 409],
    ["INTERNAL", 500],
  ] as const)("maps %s to HTTP %i", (code, status) => {
    const res = errorResponse(new AppError(code, "Nope."));
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: { code, message: "Nope." } });
  });

  it("includes field messages for validation errors", () => {
    const res = errorResponse(new AppError("VALIDATION", "Check.", { name: "Enter a name." }));
    expect(res.body).toEqual({
      error: { code: "VALIDATION", message: "Check.", fields: { name: "Enter a name." } },
    });
  });

  it("maps a raw ZodError to a 400 with fields", () => {
    const res = errorResponse(schema.safeParse(bad).error);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(res.body.error.fields?.email).toBe("Enter a valid email.");
  });

  it("hides the details of unexpected errors", () => {
    const res = errorResponse(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL", message: "Something went wrong. Try again." },
    });
  });
});
