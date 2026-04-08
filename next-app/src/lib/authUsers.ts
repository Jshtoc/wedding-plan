// Password verification layer — Node runtime only.
// Not imported by middleware (which runs on Edge), so bcryptjs is safe here.

import bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  role: string;
}

/**
 * Verify a (id, password) pair against the credentials stored in env vars.
 *
 * Env vars (production):
 *   ADMIN_ID            — the admin login id
 *   ADMIN_PASSWORD_HASH — bcrypt hash of the password (use scripts/hash-password.mjs)
 *   ADMIN_ROLE          — optional, defaults to "super_admin"
 *
 * Dev fallback:
 *   If ADMIN_ID or ADMIN_PASSWORD_HASH is missing AND NODE_ENV !== "production",
 *   accepts a hardcoded dev default (wed / 1234) with a console warning. This
 *   keeps first-run developer experience smooth while failing closed in prod.
 */
export async function verifyCredentials(
  id: string,
  password: string
): Promise<AuthUser | null> {
  const adminId = process.env.ADMIN_ID;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminRole = process.env.ADMIN_ROLE || "super_admin";

  if (!adminId || !adminHash) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[auth] ADMIN_ID or ADMIN_PASSWORD_HASH not set in production. Refusing login."
      );
      return null;
    }
    console.warn(
      "[auth] Using insecure dev default credentials (wed / 1234). Set ADMIN_ID and ADMIN_PASSWORD_HASH in .env.local before deploying."
    );
    if (id === "wed" && password === "1234") {
      return { id: "wed", role: "super_admin" };
    }
    return null;
  }

  if (id !== adminId) return null;

  const ok = await bcrypt.compare(password, adminHash);
  if (!ok) return null;

  return { id: adminId, role: adminRole };
}
