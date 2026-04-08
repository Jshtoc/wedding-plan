#!/usr/bin/env node
// Generate a bcrypt hash for a plaintext password.
// Usage: node scripts/hash-password.mjs <password>
// Then copy the output into .env.local as ADMIN_PASSWORD_HASH=...

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("Example: node scripts/hash-password.mjs 'my-secure-password'");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
