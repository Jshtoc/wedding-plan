# 💍 웨딩홀 비교 리스트

신랑(광주) 100명 + 신부(서울) 80명 / 예산 1,000만원 기준으로 서울권 웨딩홀을 비교·관리하고, 목동 출발 기준 최적 투어 동선까지 확인할 수 있는 개인용 Next.js 앱입니다.

## ✨ 기능

### 웨딩홀 리스트
- 가격, KTX 접근성, 주차 대수 기준으로 정렬
- 각 홀별 상세 정보 (가격, 교통, 뱃지, 예상 견적 계산, 메모)
- 등록 / 수정 / 삭제 (FAB 버튼 + 모달 폼)
- 버스 대절 vs KTX 단체 비교 섹션

### 투어 동선 (목동 출발)
- 6곳을 하루에 돌 수 있는 최적 루프 경로
- 각 정거장별 주소 복사 버튼 (네이버/카카오 네비 바로 붙여넣기)
- 이동 시간·거리 요약 + 투어 팁

### 인증 / 접근 제어
- 전역 미들웨어로 **모든 페이지와 API가 로그인된 사용자에게만 노출**
- HMAC-SHA256으로 서명된 httpOnly 쿠키 세션 (7일 유효)
- Edge runtime 호환 — Web Crypto API만 사용
- 기본 계정: `wed` / `1234` (super_admin)

### Twemoji 기반 이모지 렌더링
- 모든 이모지는 `TwEmoji` 컴포넌트를 통해 SVG로 렌더
- iOS/Android/Windows 간 이모지 표현 차이 제거

## 🛠 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 런타임 | React 19 |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 (@theme 기반) |
| 폰트 | Pretendard (CDN) |
| DB | Supabase (`@supabase/supabase-js`) |
| 이모지 | Twemoji SVG (jsdelivr CDN) |
| 인증 | HMAC 서명 쿠키 + Edge middleware |

## 📁 디렉토리 구조

```
next-app/
├── src/
│   ├── middleware.ts                   전역 인증 미들웨어 (Edge runtime)
│   ├── app/
│   │   ├── layout.tsx                  루트 레이아웃
│   │   ├── page.tsx                    메인 페이지
│   │   ├── globals.css                 Tailwind v4 @theme + 커스텀 CSS
│   │   ├── login/
│   │   │   └── page.tsx                로그인 폼
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts      POST  — 로그인
│   │   │   │   └── logout/route.ts     POST  — 로그아웃
│   │   │   └── halls/
│   │   │       ├── route.ts            GET, POST
│   │   │       └── [id]/route.ts       PUT, DELETE
│   │   └── components/
│   │       ├── WeddingApp.tsx          메인 앱
│   │       ├── HallCard.tsx            웨딩홀 카드
│   │       ├── HallFormModal.tsx       등록/수정 모달
│   │       ├── RouteTab.tsx            투어 동선 탭
│   │       ├── CopyButton.tsx          주소 복사 버튼
│   │       └── ui/
│   │           └── TwEmoji.tsx         Twemoji 렌더러
│   ├── lib/
│   │   ├── supabase.ts                 Supabase 클라이언트
│   │   ├── db.ts                       웨딩홀 CRUD 쿼리 helper
│   │   └── auth.ts                     토큰 sign/verify + 사용자 목록
│   └── data/
│       └── halls.ts                    타입 정의 + 동선 데이터
├── package.json
├── postcss.config.mjs                  @tailwindcss/postcss
└── tsconfig.json
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd next-app
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 세션 토큰 서명 키 (프로덕션 필수 — 랜덤 긴 문자열로 교체)
AUTH_SECRET=change-me-to-a-long-random-string
```

> **보안 주의**
> - `AUTH_SECRET`을 기본값 그대로 프로덕션에 배포하지 마세요.
> - Supabase는 **anon key만** 사용합니다. `service_role` 키는 절대 `NEXT_PUBLIC_*`로 노출하지 마세요.

### 3. Supabase 테이블 생성

`halls` 테이블을 Supabase에 만들어 두어야 합니다. 주요 컬럼(snake_case):

```
id                bigserial primary key
name              text
sub               text
price             int
price_label       text
price_text        text
price_level       text       -- 'ok' | 'warn' | 'over'
ktx               int
ktx_text          text
ktx_warn          boolean
parking           int
is_best           boolean
best_label        text
image             text
image_alt         text
image_fallback    text
badges            jsonb
info_grid         jsonb
extra_info_grid   jsonb
calc              jsonb
note              text
note_type         text
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속 → 자동으로 `/login`으로 리다이렉트 → 기본 계정 입력.

| 필드 | 값 |
|---|---|
| 아이디 | `wed` |
| 비밀번호 | `1234` |

## 🔐 인증 작동 방식

```
┌─────────────────┐
│  브라우저 요청  │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  middleware.ts (Edge)│
│                      │
│  wp_auth 쿠키 검증   │
│  HMAC 서명 확인      │
│  만료 시간 확인      │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
  통과       실패
    │         │
    ▼         ▼
  요청     /login
  처리     리다이렉트
           (API는 401)
```

- **공개 경로**: `/login`, `/api/auth/login`
- **보호 경로**: 위 외의 모든 경로
- **세션 만료**: 7일 (`SESSION_MAX_AGE_SEC`)

## 📝 프로젝트 규칙

프로젝트 루트의 `CLAUDE.md`에 모든 코딩 규칙이 정의되어 있습니다. 핵심 규칙:

- **No inline `style`** — 모든 스타일은 Tailwind 클래스 또는 `globals.css`로
- **No direct emoji in JSX** — 반드시 `TwEmoji` 컴포넌트 경유
- **No `any`** — `unknown` + 타입 가드 사용
- **Props는 `interface`로** — 파일 상단에 선언
- **Server Component 우선** — `'use client'`는 상태/이벤트가 필요할 때만
- **공통 컴포넌트 재사용** — `src/app/components/ui/` 먼저 확인

AI 페어 프로그래밍 시 참고할 더 상세한 컨벤션은 `.claude/skills/frontend/convention.md` (UI/스타일링)와 `.claude/skills/backend/convention.md` (API/DB/인증)에 있습니다.

## 🧱 아키텍처 결정 기록

### 왜 Supabase?
개인 프로젝트 규모에 맞는 가벼운 Postgres + 간단한 JS SDK. 현재는 anon key + 클라이언트 쿼리 모델이지만, 미들웨어가 모든 접근을 인증 경로로 강제하기 때문에 실질적으로 서버 경유 구조입니다.

### 왜 JWT가 아닌 HMAC 커스텀 토큰?
- Edge runtime 호환성 (jose 같은 라이브러리 설치 없이 Web Crypto만 사용)
- 의존성 최소화
- 토큰 구조가 단순해서 감사와 디버깅 쉬움
- Payload: `{ id, role, exp }` — 필요한 것만

### 왜 Twemoji?
Korean 환경(Windows + Chrome)에서 일부 이모지가 흑백으로 표시되거나 다른 글리프로 fallback되는 문제를 피하고, 모든 플랫폼에서 동일한 룩을 보장하기 위함입니다.

### 왜 Tailwind v4 + 커스텀 CSS 혼용?
- 카드/뱃지/타임라인 같은 프로젝트 고유 시각 정체성은 `globals.css`의 네임드 클래스로 관리 (DRY)
- 일회성 spacing/layout은 Tailwind 유틸리티로
- 색상 토큰은 `@theme` 블록 + `var(--...)` arbitrary value로 양쪽에서 접근 가능

## 📜 라이선스

개인 프로젝트 — 라이선스 미정.
