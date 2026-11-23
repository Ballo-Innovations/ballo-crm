/** "Kariba Power Co." -> "KP", "Ruth Phiri" -> "RP", "Zedcell" -> "Z". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w.match(/[\p{L}\p{N}]/u)![0].toUpperCase())
    .join("");
}

/**
 * Splits `text` into parts for highlighting the first case-insensitive match of `query`
 * (the command palette bolds and underlines matched letters).
 */
export function splitMatch(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return [{ text, match: false }];
  return [
    { text: text.slice(0, i), match: false },
    { text: text.slice(i, i + q.length), match: true },
    { text: text.slice(i + q.length), match: false },
  ].filter((p) => p.text);
}
