# Backend Convention

백엔드 작업 시 따라야 할 구체적인 컨벤션과 코드 패턴. `SKILL.md`가 "무엇을/왜"를 다룬다면 이 문서는 "어떻게"를 다룬다.

## 파일 & 디렉토리

### 경로 규칙

```
src/
├── app/
│   └── api/                         모든 API 라우트
│       ├── auth/
│       │   ├── login/route.ts       POST   — 로그인 (credentials → cookie)
│       │   └── logout/route.ts      POST   — 로그아웃 (쿠키 삭제)
│       └── halls/
│           ├── route.ts             GET, POST    — collection 엔드포인트
│           └── [id]/route.ts        PUT, DELETE  — item 엔드포인트
├── lib/
│   ├── supabase.ts                  Supabase 클라이언트 (단일 export)
│   ├── db.ts                        엔티티별 query helper 모음
│   └── auth.ts                      토큰 sign/verify, 사용자 목록, 쿠키 상수
└── proxy.ts                    Edge middleware — 전역 인증 체크
```

### 파일 이름 규칙

- **라우트 핸들러**: 반드시 `route.ts` (Next.js App Router 규칙)
- **동적 세그먼트**: 대괄호 디렉토리 `[id]/route.ts`, `[...slug]/route.ts`
- **라이브러리 모듈**: `camelCase.ts` (예: `db.ts`, `auth.ts`)
- **미들웨어**: 반드시 `src/proxy.ts` (Next.js 규칙)

## 라우트 핸들러 패턴

### Collection 엔드포인트 (GET, POST)

```ts
// src/app/api/<resource>/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getResources, createResource } from "@/lib/db";

export async function GET() {
  try {
    const items = await getResources();
    return NextResponse.json(items);
  } catch (e: unknown) {
    console.error("GET /api/<resource> error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: validate body shape here
    const item = await createResource(body);
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/<resource> error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### Item 엔드포인트 (PUT, DELETE) — Next.js 16 params는 async

```ts
// src/app/api/<resource>/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateResource, deleteResource } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await updateResource(Number(id), body);
    return NextResponse.json(item);
  } catch (e: unknown) {
    console.error("PUT /api/<resource>/[id] error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteResource(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("DELETE /api/<resource>/[id] error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### HTTP 상태 코드 사용 기준

| 코드 | 언제 | 예 |
|---|---|---|
| `200` | 성공 + 데이터 반환 | `GET /api/halls` |
| `201` | 리소스 생성됨 | `POST /api/halls` |
| `204` | 성공 + 본문 없음 (거의 안 씀) | — |
| `400` | 클라이언트 입력 오류 | body 누락/형식 불일치 |
| `401` | 인증 실패 | 로그인 credentials 오류 |
| `403` | 권한 부족 | `super_admin` 필요한데 일반 user |
| `404` | 리소스 없음 | 존재하지 않는 id |
| `409` | 충돌 | 중복 등록 |
| `500` | 예상치 못한 서버 오류 | Supabase 장애, 미처리 예외 |

### 응답 envelope

성공 시:
```ts
return NextResponse.json(data);          // 데이터 그대로
return NextResponse.json({ ok: true });  // 본문 없는 성공 액션 (logout 등)
```

실패 시 (반드시 `error` 필드):
```ts
return NextResponse.json({ error: "..." }, { status: 4xx|5xx });
```

**금지:** `{ success: true, data: ... }`, `{ status: "ok" }` 같은 커스텀 envelope. 프론트의 fetch 코드가 `res.ok`와 `data.error`만 본다.

## 데이터베이스 (Supabase)

### 쿼리는 반드시 `src/lib/db.ts`에

```ts
// 금지 — 라우트 핸들러에서 직접 supabase 호출
import { supabase } from "@/lib/supabase";
export async function GET() {
  const { data } = await supabase.from("halls").select("*");  // 금지
  return NextResponse.json(data);
}

// 올바른 사용
import { getHalls } from "@/lib/db";
export async function GET() {
  const halls = await getHalls();
  return NextResponse.json(halls);
}
```

### Query 함수 작성 패턴

```ts
// src/lib/db.ts
import { supabase } from "./supabase";
import { Resource } from "@/data/resources";

// DB row (snake_case) → 도메인 타입 (camelCase)
function rowToResource(row: Record<string, unknown>): Resource {
  return {
    id: row.id as number,
    name: row.name as string,
    displayName: (row.display_name as string) || "",
    createdAt: (row.created_at as string) || "",
    // ...
  };
}

// 도메인 타입 (camelCase) → DB row (snake_case)
function resourceToRow(r: Omit<Resource, "id">) {
  return {
    name: r.name,
    display_name: r.displayName,
    // created_at은 DB default로 위임
  };
}

// 목록 조회
export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToResource);
}

// 단건 조회
export async function getResourceById(id: number): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToResource(data) : null;
}

// 생성
export async function createResource(r: Omit<Resource, "id">): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .insert(resourceToRow(r))
    .select()
    .single();
  if (error) throw error;
  return rowToResource(data);
}

// 수정
export async function updateResource(
  id: number,
  r: Omit<Resource, "id">
): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .update(resourceToRow(r))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToResource(data);
}

// 삭제
export async function deleteResource(id: number): Promise<void> {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw error;
}
```

### Supabase 에러 처리 원칙

- **throw on error**: 쿼리 함수는 실패 시 에러를 `throw` 한다. `null` 반환이나 에러 무시 금지.
- **라우트 핸들러가 catch**: 라우트 핸들러의 try/catch가 모든 쿼리 실패를 HTTP 500으로 변환한다.
- **`maybeSingle` vs `single`**:
  - `.single()` — 정확히 1개 기대, 0개면 에러
  - `.maybeSingle()` — 0개 또는 1개, 0개면 `data: null`

### 케이스 변환

프로젝트는 DB는 `snake_case`, 프론트는 `camelCase`를 쓴다. 변환은 반드시 `rowToX` / `xToRow` helper에서 일원화한다. 라우트 핸들러나 프론트에서 직접 변환하지 말 것.

## 인증 & 미들웨어

### 기본 원칙

- 전역 미들웨어(`src/proxy.ts`)가 모든 경로에서 세션 쿠키를 검증한다.
- 예외 경로는 `isPublic` 조건에서 명시적으로 열어둔다.
- 라우트 핸들러는 기본적으로 "인증된 사용자"를 가정한다.

### 공개 경로 추가

```ts
// src/proxy.ts
const isPublic =
  pathname === "/login" ||
  pathname.startsWith("/api/auth/login") ||
  pathname === "/public-page";        // ← 새로 추가
```

### 역할 기반 제한 (super_admin 전용 등)

```ts
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... admin-only logic
}
```

### 쿠키 설정 (로그인 시)

```ts
res.cookies.set(AUTH_COOKIE, token, {
  httpOnly: true,                                       // JS 접근 차단 (XSS 완화)
  sameSite: "lax",                                      // CSRF 완화
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",       // prod는 HTTPS 필수
});
```

### 쿠키 삭제 (로그아웃 시)

```ts
res.cookies.set(AUTH_COOKIE, "", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 0,                                            // 즉시 만료
  secure: process.env.NODE_ENV === "production",
});
```

### 세션 토큰 구조

`src/lib/auth.ts`에서 HMAC-SHA256으로 서명된 토큰 사용:

```
<base64url(payload)>.<base64url(hmac)>

payload = { id: string, role: string, exp: number /* ms epoch */ }
```

Edge runtime 제약 때문에 Web Crypto(`crypto.subtle`)만 사용한다. Node의 `crypto` 모듈 금지.

## Edge runtime 제약

`src/proxy.ts`에서 import하는 모든 파일(transitive 포함)은 Edge runtime에서 동작해야 한다.

### 사용 가능
- `TextEncoder`, `TextDecoder`
- `crypto.subtle` (Web Crypto API)
- `btoa`, `atob`
- `fetch`
- `URL`, `URLSearchParams`

### 금지
- `import crypto from "crypto"` (Node 모듈)
- `import fs from "fs"`
- `import path from "path"`
- `Buffer` (기본 전역이지만 Edge에는 없음)
- `process.env`는 일부 제한 — 빌드 타임에 치환되는 값만 안전

### 우회 전략

만약 `proxy.ts`와 API 라우트가 공통 로직을 공유하고, 그 로직이 Node 모듈을 필요로 한다면:
1. 공통 부분을 Web Crypto만 쓰는 파일로 추출 (예: `src/lib/auth.ts`)
2. Node 전용 확장이 필요하면 별도 파일에 두고, middleware에서 import하지 않기

## 환경 변수

| 변수 | 노출 범위 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | anon public key |
| `AUTH_SECRET` | 서버 전용 | HMAC 토큰 서명 키 (프로덕션 필수) |
| `ADMIN_ID` | 서버 전용 | 관리자 로그인 ID |
| `ADMIN_PASSWORD_HASH` | 서버 전용 | bcrypt 해시된 관리자 비밀번호 (`npm run hash-password`로 생성) |
| `ADMIN_ROLE` | 서버 전용 | 관리자 역할 (기본 `super_admin`) |

### 규칙
- **Secret에 `NEXT_PUBLIC_` 접두사 금지** — 클라이언트 번들에 노출된다.
- `service_role` 키는 절대 사용 금지 (현재 프로젝트는 anon 키 + RLS 모델).
- 새 환경 변수 추가 시 `.env.example` (있다면) 업데이트, 없다면 README나 CLAUDE.md에 명시.

## 타입스크립트

### 에러 처리

```ts
try {
  // ...
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error";
  // ...
}
```

### 요청 body 검증

```ts
// 간단한 경우 — 타입 캐스트 + 런타임 체크
const { id, password } = (await req.json()) as {
  id?: string;
  password?: string;
};
if (typeof id !== "string" || typeof password !== "string") {
  return NextResponse.json({ error: "Invalid body" }, { status: 400 });
}

// 복잡한 경우 — zod 등 스키마 라이브러리 도입 고려 (현재 미사용)
```

### 금지 패턴

```ts
// any 사용
function handler(e: any) {}                    // 금지
catch (e: any) {}                              // 금지

// 에러 무시
const { data } = await supabase.from(...).select();  // error 체크 누락 — 금지

// Node 모듈을 auth.ts에 import
import crypto from "crypto";                   // 금지 (middleware에서 쓰면 터짐)

// 라우트 핸들러에서 직접 supabase
await supabase.from("halls").select("*");       // 금지 (db.ts로)
```

## 작업 전 체크리스트

1. `CLAUDE.md` 읽기 (세션 첫 작업이면 필수)
2. 수정할 라우트/lib 파일 Read로 전체 읽기
3. 미들웨어에서 이 경로가 public인지 확인
4. 변경 범위가 요청된 수준을 넘지 않는지 확인

## 작업 후 체크리스트

1. 모든 라우트 핸들러가 try/catch + `{ error: message }` envelope 사용
2. Supabase 쿼리가 모두 `src/lib/db.ts`에 있음 (라우트 인라인 0개)
3. `any` 0개, catch는 `e: unknown`
4. 동적 세그먼트 route는 `params`를 `await`함 (Next.js 16 규칙)
5. 쿠키는 `httpOnly` + `sameSite: "lax"` + prod `secure`
6. `proxy.ts`에서 reachable한 코드는 Edge runtime 호환
7. 새 환경 변수는 secret이 `NEXT_PUBLIC_`로 새지 않음

## 빠른 참고 — 새 CRUD 엔드포인트 추가 절차

1. **DB query 함수 추가** → `src/lib/db.ts`에 `getX`, `createX`, `updateX`, `deleteX` 작성. `rowToX`/`xToRow` helper 포함.
2. **라우트 파일 생성**
   - Collection: `src/app/api/<resource>/route.ts` (GET, POST)
   - Item: `src/app/api/<resource>/[id]/route.ts` (PUT, DELETE, GET)
3. **템플릿 복사** → 위의 "라우트 핸들러 패턴" 섹션 복붙 후 이름만 치환.
4. **body 검증** → POST/PUT은 최소한 타입 체크 + 400 반환.
5. **params await** → 동적 세그먼트는 반드시 `const { id } = await params;`.
6. **미들웨어 확인** → public이어야 하면 `isPublic`에 추가, 아니면 그대로.
7. **프론트 fetch 업데이트** → URL, method, body 형식, 에러 처리 맞추기.
8. **수동 테스트** → curl 또는 브라우저로 happy path + error path 확인.
