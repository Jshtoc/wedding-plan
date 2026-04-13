// Password verification layer — Node runtime only.
// Not imported by the Edge proxy (src/proxy.ts), so bcryptjs is safe here.

import bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  role: string;
  groupId: string;
}

interface UserEntry {
  id: string;
  hash: string;
  role: string;
}

/**
 * Load the fixed list of users from environment variables.
 *
 * This project has exactly two accounts (husband + wife), configured via:
 *   USER1_ID, USER1_PASSWORD_HASH, USER1_ROLE   → husband
 *   USER2_ID, USER2_PASSWORD_HASH, USER2_ROLE   → wife
 *
 * Roles default to "husband" and "wife" if not set. Add more USER3_*, USER4_*
 * here if you ever need additional fixed accounts.
 */
function loadUsers(): UserEntry[] {
  const users: UserEntry[] = [];

  const u1Id = process.env.USER1_ID;
  const u1Hash = process.env.USER1_PASSWORD_HASH;
  if (u1Id && u1Hash) {
    users.push({
      id: u1Id,
      hash: u1Hash,
      role: process.env.USER1_ROLE || "husband",
    });
  }

  const u2Id = process.env.USER2_ID;
  const u2Hash = process.env.USER2_PASSWORD_HASH;
  if (u2Id && u2Hash) {
    users.push({
      id: u2Id,
      hash: u2Hash,
      role: process.env.USER2_ROLE || "wife",
    });
  }

  const u3Id = process.env.USER3_ID;
  const u3Hash = process.env.USER3_PASSWORD_HASH;
  if (u3Id && u3Hash) {
    users.push({
      id: u3Id,
      hash: u3Hash,
      role: process.env.USER3_ROLE || "guest",
    });
  }

  return users;
}

/**
 * Load group membership from GROUP{N}_ID / GROUP{N}_MEMBERS env vars.
 * Returns a Map<userId, groupId>. Users without a group get their own
 * solo group equal to their user id.
 */
function loadGroups(): Map<string, string> {
  const map = new Map<string, string>();
  for (let n = 1; n <= 20; n++) {
    const gId = process.env[`GROUP${n}_ID`];
    const gMembers = process.env[`GROUP${n}_MEMBERS`];
    if (!gId || !gMembers) continue;
    for (const member of gMembers.split(",")) {
      const trimmed = member.trim();
      if (trimmed) map.set(trimmed, gId);
    }
  }
  return map;
}

/**
 * Verify (id, password) against the configured users.
 *
 * Dev fallback:
 *   If no USER*_ID / USER*_PASSWORD_HASH is set AND NODE_ENV !== "production",
 *   accepts wed1 or wed2 with password "wed1234" so local `npm run dev` works
 *   without any setup. In production this returns null (fail closed).
 */
export async function verifyCredentials(
  id: string,
  password: string
): Promise<AuthUser | null> {
  const users = loadUsers();
  const groups = loadGroups();

  if (users.length === 0) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[auth] No USER*_ID / USER*_PASSWORD_HASH configured in production. Refusing login."
      );
      return null;
    }
    console.warn(
      "[auth] No users configured. Using dev defaults — wed1 / wed1234 (husband) and wed2 / wed1234 (wife)."
    );
    if (password === "wed1234") {
      if (id === "wed1") return { id: "wed1", role: "husband", groupId: "dev-couple" };
      if (id === "wed2") return { id: "wed2", role: "wife", groupId: "dev-couple" };
    }
    return null;
  }

  const user = users.find((u) => u.id === id);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.hash);
  if (!ok) return null;

  // Look up the group. If no group is configured, assign a solo group
  // equal to the user's id so they still get isolated data.
  const groupId = groups.get(user.id) || user.id;

  return { id: user.id, role: user.role, groupId };
}
