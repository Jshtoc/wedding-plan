// HMAC-signed session token utilities (Web Crypto, edge-compatible)

export const AUTH_COOKIE = "wp_auth";
const SECRET =
  process.env.AUTH_SECRET || "wedding-plan-dev-secret-please-change-in-prod";

// Hardcoded user list
export const USERS: { id: string; password: string; role: string }[] = [
  { id: "wed", password: "1234", role: "super_admin" },
];

export function verifyCredentials(id: string, password: string) {
  const user = USERS.find((u) => u.id === id && u.password === password);
  if (!user) return null;
  return { id: user.id, role: user.role };
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export type SessionPayload = {
  id: string;
  role: string;
  exp: number; // ms since epoch
};

export async function createToken(payload: SessionPayload): Promise<string> {
  const key = await getKey();
  const data = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  const sig = b64urlEncode(sigBytes);
  return `${data}.${sig}`;
}

export async function verifyToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(data))
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// 7 days
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;
