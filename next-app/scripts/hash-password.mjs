#!/usr/bin/env node
// Generate a bcrypt hash for a plaintext password.
// Usage: node scripts/hash-password.mjs <password>

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("Example: node scripts/hash-password.mjs 'my-secure-password'");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const escaped = hash.replaceAll("$", "\\$");

console.log("");
console.log("Raw hash (paste into Vercel / Supabase dashboards):");
console.log("  " + hash);
console.log("");
console.log("Escaped hash (paste into .env.local — Next.js expands $):");
console.log("  " + escaped);
console.log("");
