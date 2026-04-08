---
name: backend
description: Backend implementation rules and conventions for this Next.js App Router API routes + Supabase + middleware-based auth project. Use this skill whenever the user asks you to build, modify, refactor, review, or fix anything server-side — API endpoints under src/app/api/, database access via Supabase, authentication and session logic, middleware/cookie handling, route handlers, or any file under src/lib/. This covers creating new API routes, adding query functions, touching auth/login/logout/middleware, mapping DB rows to domain types, handling errors from Supabase, or anything that runs on the server rather than in the browser. Trigger this skill even when the user doesn't explicitly say "backend" — any task that involves src/app/api/, src/lib/, src/proxy.ts, HTTP request handling, database schemas, or cookies counts. Also trigger when the user describes a server problem in plain terms like "API에서 오류나", "로그인이 안 돼", "DB에서 가져와줘", "이 라우트 만들어줘".
---

# Backend Skill

This skill encodes the rules, conventions, and decision-making patterns for backend work in this wedding-plan project. The backend is a Next.js App Router application with API routes under `src/app/api/`, a Supabase-backed database layer in `src/lib/db.ts`, HMAC-signed cookie auth in `src/lib/auth.ts`, and a global middleware at `src/proxy.ts` that protects every route except `/login` and `/api/auth/login`.

Before starting, also read `CLAUDE.md` at the project root — it is the authoritative source of project-wide rules, and this skill is a more detailed companion to it for server-side work.

For concrete code templates (route handlers, DB query helpers, auth/cookie setup), HTTP status code guidelines, Edge runtime constraints, and the step-by-step recipe for adding a new CRUD endpoint, read `convention.md` in this same skill directory. Refer to it whenever you're about to create a new route, add a DB function, touch auth, or are unsure about an idiomatic server-side pattern.

## Tech stack

- **Next.js 16** App Router — API routes are `route.ts` files under `src/app/api/`.
- **Runtime:** Node.js for API routes; Edge runtime for `proxy.ts` (Web Crypto only, no Node APIs).
- **Database:** Supabase (`@supabase/supabase-js`) via a single client exported from `src/lib/supabase.ts`. Database access functions live in `src/lib/db.ts`.
- **Auth:** HMAC-SHA256 signed session tokens stored in an httpOnly cookie (`wp_auth`). All auth utilities are in `src/lib/auth.ts`. Middleware at `src/proxy.ts` verifies the cookie on every request.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_SECRET`.

## Directory layout

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts     POST  — verify credentials, set cookie
│       │   └── logout/route.ts    POST  — clear cookie
│       └── halls/
│           ├── route.ts           GET, POST   — list, create halls
│           └── [id]/route.ts      PUT, DELETE — update, delete one hall
├── lib/
│   ├── supabase.ts                Single Supabase client
│   ├── db.ts                      Typed query helpers (getHalls, createHall, ...)
│   └── auth.ts                    Token sign/verify, user list, cookie name
└── proxy.ts                  Edge middleware — enforces auth on all routes
```

## Core rules

### 1. Route handlers return `NextResponse.json` with consistent error shape

**Rule:** Every route handler follows the same structure: try/catch around the logic, success returns `NextResponse.json(data)` (or with a status code), errors return `NextResponse.json({ error: message }, { status })`.

**Why:** The frontend fetch code relies on an `error` field being present on failure responses. A consistent shape means callers never need to guess at the envelope.

**Template:**
```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // ... do the thing
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("POST /api/... error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Status codes to use:**
- `200` (default) — success, returning data.
- `201` — resource created.
- `400` — client sent invalid input (missing fields, wrong types).
- `401` — unauthenticated (wrong credentials, invalid/missing token). Middleware handles most of these, but login/password-change endpoints return 401 explicitly.
- `404` — requested resource doesn't exist.
- `500` — unexpected server error (Supabase failure, unknown exception).

Do not invent custom statuses or return `{ success: true }` envelopes — return the data directly on success, error object on failure.

### 2. No `any`, narrow `unknown` properly

**Rule:** Never use `any`. Catch blocks use `unknown` and narrow via `e instanceof Error`. Request bodies are typed after parsing.

**Why:** Same reason as the frontend — `any` silently breaks refactors and hides bugs that TypeScript was supposed to catch.

**How to apply:**
```ts
try {
  // ...
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error";
}
```

For request bodies, parse as `unknown` and validate shape before using:
```ts
const body = await req.json();
if (typeof body !== "object" || body === null) {
  return NextResponse.json({ error: "Invalid body" }, { status: 400 });
}
// then access fields with runtime checks
```

For small/well-known bodies it's OK to destructure with explicit types:
```ts
const { id, password } = (await req.json()) as { id?: string; password?: string };
if (typeof id !== "string" || typeof password !== "string") {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

### 3. Database access goes through `src/lib/db.ts`

**Rule:** Never call `supabase.from(...)` directly inside a route handler. All Supabase queries live in `src/lib/db.ts` as named functions (`getHalls`, `createHall`, `updateHall`, `deleteHall`, ...), and route handlers call those.

**Why:** Centralizing queries keeps the DB ↔ domain mapping in one place. The project's DB uses `snake_case` column names while frontend types use `camelCase`, and the conversion happens in `rowToHall` / `hallToRow` helpers — scattering this across routes would duplicate the mapping and drift.

**How to apply when adding a new query:**
1. Add the function to `src/lib/db.ts`.
2. Write a `rowToX` / `xToRow` helper if the entity needs case-conversion.
3. Throw on Supabase errors (don't return `null` or `undefined`) — route handlers catch and convert to HTTP 500.
4. Return domain types (the camelCase versions from `src/data/*`), not raw rows.

**Example:**
```ts
export async function getHalls(): Promise<WeddingHall[]> {
  const { data, error } = await supabase
    .from("halls")
    .select("*")
    .order("price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToHall);
}
```

### 4. Auth: cookie + middleware, not per-route checks

**Rule:** Don't sprinkle auth checks into individual route handlers. The middleware at `src/proxy.ts` already enforces authentication on every route except `/login` and `/api/auth/login`. A route handler can assume a valid session exists.

**Why:** A single chokepoint is easier to reason about and to audit. Adding per-route checks invites bypasses when someone forgets.

**Protected by default, exceptions listed explicitly:**
```ts
// proxy.ts
const isPublic =
  pathname === "/login" ||
  pathname.startsWith("/api/auth/login");
```

To make a new route public, add it to the `isPublic` condition in `proxy.ts`. To add role-based restrictions (e.g., admin-only), verify the token inside the route handler using `verifyToken` and check `payload.role`:

```ts
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifyToken(token);
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... admin-only logic
}
```

### 5. Cookies: httpOnly, sameSite lax, secure in prod

**Rule:** Auth cookies must be set with `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, and `secure: true` in production.

**Why:** httpOnly blocks JavaScript access (XSS mitigation), sameSite lax blocks most CSRF while still allowing top-level navigation, secure forces HTTPS in production.

**Template (see `src/app/api/auth/login/route.ts`):**
```ts
res.cookies.set(AUTH_COOKIE, token, {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
});
```

Clearing is the same, with `maxAge: 0` and empty value.

### 6. Middleware runs on the Edge — Web Crypto only

**Rule:** Code imported by `src/proxy.ts` (transitively) cannot use Node-only APIs. Use Web Crypto (`crypto.subtle`) for signing/verifying, `TextEncoder`/`TextDecoder` for bytes, `btoa`/`atob` for base64.

**Why:** Next.js middleware runs in the Edge runtime, which does not expose Node's `crypto`, `fs`, `buffer`, etc. Importing those would crash at build or run time.

**How to apply:** `src/lib/auth.ts` is the shared module between the login API (Node runtime) and the middleware (Edge runtime), so it only uses Web Crypto. If you need to add helpers that use Node-only APIs, keep them in a separate file and don't import that file from `proxy.ts`.

### 7. Dynamic route params in Next.js 16 are async

**Rule:** In Next.js 15+, the `params` and `searchParams` arguments to route handlers, pages, and layouts are `Promise`s. Await them before use.

**Why:** Next.js made these async to support streaming and parallel routing. The old sync form is removed in 16.

**Template:**
```ts
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

**Note:** The current project files in `src/app/api/halls/[id]/route.ts` still use the old sync form (`{ params }: { params: { id: string } }`). Update them when touching those files, since the project is now on Next.js 16.

### 8. Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public (shipped to client). Only anon key, never service role.
- `AUTH_SECRET` — server-only. Used to sign HMAC tokens. Must be set in production (the default fallback in `src/lib/auth.ts` is for dev only).

Never introduce a `NEXT_PUBLIC_` variable for a secret. If a value must stay server-only, omit the `NEXT_PUBLIC_` prefix and access it only in server code.

## Workflow checklist

Before considering a backend change done, walk through this list:

1. **Read `CLAUDE.md`** if you haven't already this session.
2. **Read the route/lib file** you're editing fully before modifying.
3. **Supabase queries go in `src/lib/db.ts`**, not inline in the route.
4. **Route handler returns** `NextResponse.json(...)` with consistent error shape.
5. **No `any`**; catch blocks use `unknown` + `instanceof Error`.
6. **Middleware handles auth by default** — don't duplicate in the route unless role-specific.
7. **Cookies** are httpOnly + sameSite lax + secure in prod.
8. **Dynamic params** (`[id]`) are awaited (`await params`) — Next.js 16 convention.
9. **No Node-only imports** in any file transitively reachable from `proxy.ts`.
10. **No secrets** in `NEXT_PUBLIC_*` env vars.
11. **Only change what was asked** — don't drive-by refactor unrelated routes.

If the user's request conflicts with one of these rules (e.g., "make this route skip auth"), ask before proceeding. Security-adjacent rules especially exist for reasons that aren't obvious from the code alone.

## Quick reference — adding a new API endpoint

This is the 60-second path for a new CRUD endpoint, to save walking through every file from scratch:

1. **Add the query function to `src/lib/db.ts`.** Reuse existing `rowToX` / `xToRow` helpers or write new ones if adding a new entity. Throw on Supabase errors.
2. **Create the route file** at `src/app/api/<resource>/route.ts` (for collection endpoints) or `src/app/api/<resource>/[id]/route.ts` (for item endpoints).
3. **Use the route handler template** — try/catch, `NextResponse.json`, `e instanceof Error` in catch.
4. **Validate request body shape** for POST/PUT — return 400 on bad input.
5. **Await `params`** if the route has a dynamic segment.
6. **No explicit auth check** — middleware has you covered unless you need role-based gating.
7. **Update the frontend fetch call** to match (method, URL, body shape, error handling).
