import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { parseInput } from "@/lib/validation";

import { formatPhone, normalizePhone } from "./service";
import { contactInputSchema } from "./types";

// E2-03: contacts on the Account 360 Contacts tab. Phones are stored as E.164 and shown as
// "+260 97 123 4567" (design system, "Numbers, dates and text").

describe("normalizePhone", () => {
  it.each([
    ["+260 97 123 4567", "+260971234567"],
    ["0971234567", "+260971234567"],
    ["97 123 4567", "+260971234567"],
    ["260971234567", "+260971234567"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("%s -> %s", (raw, out) => {
    expect(normalizePhone(raw)).toBe(out);
  });

  it("rejects what cannot be a phone number", () => {
    expect(normalizePhone("12")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("groups Zambian numbers as +260 97 123 4567", () => {
    expect(formatPhone("+260971234567")).toBe("+260 97 123 4567");
  });

  it("leaves other countries as stored", () => {
    expect(formatPhone("+442079460958")).toBe("+442079460958");
  });
});

describe("contactInputSchema", () => {
  const good = {
    firstName: " Natasha ",
    lastName: "Mwale",
    title: "Chief Financial Officer",
    email: "natasha@example.zm",
    phone: "097 123 4567",
    influence: "4",
    stance: "SUPPORTER",
  };

  it("trims, normalises the phone and reads influence as a number", () => {
    expect(parseInput(contactInputSchema, good)).toEqual({
      firstName: "Natasha",
      lastName: "Mwale",
      title: "Chief Financial Officer",
      email: "natasha@example.zm",
      phone: "+260971234567",
      influence: 4,
      stance: "SUPPORTER",
    });
  });

  it("treats empty optional fields as not given", () => {
    expect(
      parseInput(contactInputSchema, { ...good, title: "", email: " ", phone: "" }),
    ).toMatchObject({ title: null, email: null, phone: null });
  });

  it("gives one plain message per bad field", () => {
    let err: unknown;
    try {
      parseInput(contactInputSchema, {
        firstName: "",
        lastName: "",
        email: "not-an-email",
        phone: "12",
        influence: "9",
        stance: "FRIEND",
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).fields).toEqual({
      firstName: "Enter a first name.",
      lastName: "Enter a last name.",
      email: "Enter a valid email, like name@company.zm.",
      phone: "Enter a phone number, like 97 123 4567.",
      influence: "Pick an influence from 1 to 5.",
      stance: "Pick a stance.",
    });
  });
});
