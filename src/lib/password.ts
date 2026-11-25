import bcrypt from "bcryptjs";

/** Cost 10 keeps a login under ~100ms on the dev VM while staying well above brute-force speed. */
const COST = 10;

/** bcrypt hash for storing in `User.password` (security doc: "Passwords: bcrypt"). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** True only when `plain` matches the stored hash; a malformed hash counts as a mismatch. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
