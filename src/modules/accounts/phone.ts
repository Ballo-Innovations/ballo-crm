/**
 * Phone numbers are stored as E.164 and shown as "+260 97 123 4567" (design system,
 * "Numbers, dates and text"). Local Zambian forms ("097 123 4567", "97 123 4567") get +260.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[\s().-]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;

  let e164: string;
  if (plus) e164 = digits;
  else if (digits.startsWith("260")) e164 = digits;
  else if (digits.startsWith("0") && digits.length === 10) e164 = `260${digits.slice(1)}`;
  else if (digits.length === 9) e164 = `260${digits}`;
  else return null;

  return e164.length >= 8 && e164.length <= 15 ? `+${e164}` : null;
}

export function formatPhone(e164: string): string {
  const m = /^\+260(\d{2})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+260 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
