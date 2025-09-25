// src/lib/passwords.ts
import bcrypt from "bcryptjs";
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string | null | undefined) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}
