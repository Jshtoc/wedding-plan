# 프로젝트 규칙

## 작업 전 필수 — Skill 참조

프로젝트 전용 Skill이 `.claude/skills/` 아래에 정의되어 있습니다. 작업 성격에 맞는 skill과 그 convention 문서를 **반드시** 먼저 읽으세요.

- **`frontend`** — UI/JSX/TSX/스타일/컴포넌트 관련 모든 코드 작업
  - `.claude/skills/frontend/SKILL.md` — 규칙과 원칙 (무엇을/왜)
  - `.claude/skills/frontend/convention.md` — 코드 템플릿과 구체 패턴 (어떻게)
- **`design`** — 색상/여백/타이포/radius/shadow/컴포넌트 외관 등 모든 시각 디자인 작업
  - `.claude/skills/design/SKILL.md` — 디자인 원칙과 팔레트 (무엇을/왜)
  - `.claude/skills/design/convention.md` — 토큰 값, 스케일, 컴포넌트 패턴, do/don't (어떻게)
- **`backend`** — API 라우트/Supabase/미들웨어/인증/`src/lib/` 작업
  - `.claude/skills/backend/SKILL.md` — 규칙과 원칙 (무엇을/왜)
  - `.claude/skills/backend/convention.md` — 코드 템플릿과 구체 패턴 (어떻게)

**UI 작업은 보통 `frontend` + `design` 두 skill을 함께 참조하세요.** frontend는 "코드가 맞나", design은 "모양이 맞나"를 담당합니다.

## 절대 규칙

### 이모지(Emoji) 사용 금지

**JSX/TSX 파일에서 이모지를 직접 사용하는 것은 엄격히 금지합니다.**

모든 이모지는 반드시 `TwEmoji` 컴포넌트를 통해 렌더링해야 합니다.

```tsx
// 금지
<span>🚀</span>
<div>완료</div>
<p>교육 프로그램</p>

// 올바른 사용
import TwEmoji from '@/components/ui/TwEmoji'

<TwEmoji emoji="🚀" size={24} />
<TwEmoji emoji="✅" size={20} />
<TwEmoji emoji="🎓" size={32} />
```

데이터 배열의 `icon` 필드처럼 **문자열로 저장**하는 것은 허용합니다.
단, JSX에서 렌더링할 때는 반드시 `TwEmoji`를 사용하세요.

```tsx
// 데이터 정의 — 문자열로 저장 허용
const features = [
  { icon: '🚀', title: '빠른 성장', description: '...' },
]

// 렌더링 — TwEmoji 사용 필수
features.map(f => (
  <FeatureCard icon={f.icon} title={f.title} description={f.description} />
))
// FeatureCard 내부에서 TwEmoji로 렌더링합니다.
```

## 공통 컴포넌트 사용 필수

`components/ui/` 에 정의된 공통 컴포넌트가 있는 경우, 인라인으로 동일한 UI를 재구현하는 것을 금지합니다.
새로운 페이지나 기능을 추가할 때 반드시 아래 컴포넌트 목록을 먼저 확인하세요.

### 컴포넌트 목록

- `TwEmoji` (`src/app/components/ui/TwEmoji.tsx`) — Twemoji SVG로 이모지를 렌더하는 컴포넌트.
  - props: `emoji: string`, `size?: number` (기본 18), `className?`, `style?`, `alt?`
- `AuroraBackground` (`src/app/components/ui/AuroraBackground.tsx`) — Aceternity UI의 오로라 배경 래퍼. `/login` 같은 auth 페이지 전용. 내부적으로 `repeating-linear-gradient` 레이어 + `mix-blend-difference` + `background-position` 애니메이션으로 흐르는 오로라 커튼 생성.
  - props: `children: ReactNode`, `className?` (보통 `"dark"` 필수), `showRadialGradient?` (기본 true), `animationSpeed?` (초, 기본 60)
  - 사용: `<AuroraBackground className="dark">...</AuroraBackground>`. `dark` 클래스 반드시 포함해야 다크 배경 + 오로라 경로가 활성화됨.

### 사용 예시

```tsx
import Section from '@/components/ui/Section'
import SectionHeader from '@/components/ui/SectionHeader'
import FeatureCard from '@/components/ui/FeatureCard'
import FilterButton from '@/components/ui/FilterButton'
import EmptyState from '@/components/ui/EmptyState'
import FormInput from '@/components/ui/FormInput'
import StatCard from '@/components/ui/StatCard'
import ReviewCard from '@/components/ui/ReviewCard'
import Avatar from '@/components/ui/Avatar'
import StepIndicator from '@/components/ui/StepIndicator'
import PageHero from '@/components/ui/PageHero'

// 섹션 래퍼
<Section className="bg-gray-50">
  <SectionHeader
    label="PROGRAM"
    title="FLY AI 프로그램"
    description="AI 전문가로 성장하는 여정"
  />
</Section>
```

---

## 기술 스택 및 컨벤션

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript — `any` 사용 금지, 모든 props에 interface 정의
- **스타일**: Tailwind CSS v4 — 인라인 style 속성 사용 금지
- **이모지**: Twemoji (`components/ui/TwEmoji.tsx`) — 직접 이모지 문자 사용 금지

### 폰트

Pretendard를 기본 폰트로 사용합니다 (`--font-pretendard`).

### 컴포넌트 작성 규칙

- Server Component 우선, 클라이언트 상태가 필요한 경우만 `'use client'` 추가
- props interface는 컴포넌트 파일 상단에 정의
- default export 사용

---

## 신규 공통 컴포넌트 추가 기준

아래 조건을 **모두** 충족하면 공통 컴포넌트로 추출하세요:

1. **3개 이상의 파일**에서 동일한 UI 패턴이 반복된다
2. props 변경만으로 재사용 가능한 구조다
3. 비즈니스 로직이 포함되지 않은 순수 UI 컴포넌트다

추출 후 반드시 이 문서의 **컴포넌트 목록**을 업데이트하세요.

---

## 현재 구현 상태 (2026-04-10 기준)

### 인증 & 기반
- **인증**: 2인 고정 계정 (`wed1`/`wed2`), bcrypt 해시, HMAC 쿠키 세션, Edge proxy 전역 보호
- **로그인 페이지**: Aceternity 스타일 오로라 배경 + 투명 글라스 카드 (민트/그린 팔레트)
- **WWP 브랜드 자산**: favicon, apple-icon, 로고 SVG, OpenGraph/Twitter 카드
- **Pretendard 폰트** (React 19 link hoisting)
- **`.env.local`의 `$` escape 규칙** (backend skill convention에 문서화)

### 대시보드 Shell
- 좌측 사이드바 (데스크톱) / 햄버거 드로어 (모바일), 7개 고정 섹션 + custom 예산 항목 동적 탭
- 상단 Section header, 메인 영역 max-w-5xl

### Overview 섹션
- **StatusCards**: 웨딩홀/스튜디오/드레스/메이크업/예정 일정 실 카운트 + accent 표시
- **예산 도넛 차트**: 고정 카테고리 + custom 항목 모두 반영
- **월 캘린더**: 일정 있는 날짜 클릭 → 수정 모달
- **다가오는 일정 리스트**: D-day 표시, 클릭으로 수정, 우상단 "+ 일정 추가" 버튼

### 웨딩홀
- **CRUD**: Supabase `halls` 테이블 (8필드: name/sub/price/guests/parking/transport/note + id), 다크 카드 그리드, 정렬(가격/보증인원/주차), FAB 추가
- **URL 자동 채움**: `/api/fetch-preview` — OG/Twitter meta 파싱으로 이름/위치/메모 자동 입력
- **동적 priceLevel dot**: 결혼 예산의 웨딩홀 카테고리 대비 `computePriceLevel()` 로 🟢🟡🔴 표시
- **HallFormModal**: 다크 글라스 테마, 교통편 칩(지하철/버스/기차), 가격 등급 안내 popover

### 결혼 예산
- **Supabase `budgets` 테이블**: 4개 고정 카테고리(hall/studio/dress/makeup) + `total` pseudo-row + `custom:*` 임의 항목
- **총 예산 목표** 입력 + 배분 합계와의 차액 표시(여유/초과 색상 구분)
- **Custom 항목**: 이름/아이콘/금액 자유롭게 추가, `BUDGET_ICONS` 24개 팔레트에서 아이콘 피커
- **편집 모드**: 체크박스 기반 선택 삭제, 전체 선택, 정보 있는 항목 삭제 시 확인 다이얼로그
- **사이드바 동적 탭**: custom 항목이 저장되면 "My Items" 섹션 하위에 탭으로 자동 추가 (삭제하면 사라짐)
- **다크 커스텀 체크박스**: `peer` 패턴 기반, mint glow 강조

### 캘린더 (events)
- **Supabase `events` 테이블**: date/title/type/time/location/memo
- **EventFormModal**: 다크 테마, 타입 칩(웨딩홀/스튜디오/드레스/메이크업/기타), 삭제 버튼 포함
- **CRUD 진입점**: 다가오는 일정 리스트의 "+ 일정 추가" 버튼 + 일정 카드 클릭 + 캘린더 날짜 클릭

### 스튜디오 · 드레스 · 메이크업 (vendors)
- **3개 테이블 공통 스키마**: `studios`/`dresses`/`makeups` (name/sub/price/note), 드레스만 `target` (groom/bride) 추가
- **Generic 컴포넌트**: `VendorFormModal` + `VendorListSection` 하나로 3섹션 모두 커버
- **단일 동적 API 라우트**: `/api/vendors/[category]/...` (GET/POST/PUT/DELETE)
- **드레스 sub-tab**: 신부/신랑 필터, 각 카운트 표시
- **카드 클릭으로 편집**, FAB로 추가

### 실시간 동기화
- **Supabase Realtime 단일 채널** (`wwp-shared`): 6개 테이블 모두 리스너 — halls / budgets / events / studios / dresses / makeups
- **편집 중 충돌 머지**: BudgetSection은 category-keyed baseline 기반 merge로 로컬 편집 보존

### 공통 디자인
- 전역 다크 글라스 테마 (`bg-[#020806]`, white overlay)
- 커스텀 스크롤바 (얇은 흰색 오버레이, hover 시 민트 glow)
- `<input type="number">` 스피너 버튼 전역 숨김
- 모든 인풋/버튼이 브랜드 민트(#00FFE1) 강조

### 진행 중 / Stub 상태
- **동선 계산** — EmptyState placeholder, 기존 `RouteTab`은 legacy (미사용)

### Legacy / 삭제 후보
- `src/app/components/RouteTab.tsx` — warm 테마 기존 투어 동선, 미사용
- `src/app/components/CopyButton.tsx` — RouteTab 전용, 미사용
- `globals.css`의 warm 테마 전용 클래스 (`.modal-*`, `.form-*`, `.btn-*`, `.tl-*`, `.copy-btn` 등) — 실 사용처 없음
- 삭제 전에 `grep -r` 로 사용처 재확인

---

## 개발 환경 / 인프라

### Supabase 프로젝트
- **Project ref**: `veaktwkvuuuhmcxgvdeh`
- **Region**: `ap-northeast-1` (도쿄 — Supabase에 서울 리전 없음)
- **URL**: `https://veaktwkvuuuhmcxgvdeh.supabase.co`
- **테이블 (총 6개)**: `halls`, `budgets`, `events`, `studios`, `dresses`, `makeups`
- **RLS**: 전부 disabled — 액세스는 Next.js proxy에서 쿠키 세션 기반으로 차단
- **Realtime publication (`supabase_realtime`)**: 위 6개 테이블 전부 포함

### DB 마이그레이션 워크플로 (WebStorm)

**연결 정보** (WebStorm Data Source — PostgreSQL):
- **Connection type**: URL only
- **URL**: `jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?user=postgres.veaktwkvuuuhmcxgvdeh&sslmode=require`
- **Authentication**: User & Password
- **User**: `postgres.veaktwkvuuuhmcxgvdeh` (⚠️ `.프로젝트ref` 포함 필수)
- **Password**: DB 비밀번호 (Settings → Database → Reset password로 재설정 가능)
- **SSL mode**: require
- **주의**: Session pooler 주소(`aws-1-...pooler.supabase.com`)만 IPv4. Direct connection(`db....`)은 IPv6-only라 국내 안 붙음

**워크플로**:
1. 제가 `next-app/supabase/*.sql` 파일을 새로 만들거나 수정
2. 사용자가 WebStorm에서 해당 SQL 파일 열기
3. 우상단 드롭다운에서 Supabase 데이터소스 선택 확인
4. `Ctrl + Shift + E` 또는 초록 ▶ 로 실행
5. 결과 패널에서 성공 여부 확인
- 모든 마이그레이션 파일은 idempotent하게 작성됨 (`IF NOT EXISTS`, `DO $$ ... EXCEPTION`) — 재실행 안전

### 마이그레이션 히스토리 (순서대로)

| # | 파일 | 설명 |
|---|---|---|
| 1 | `supabase/schema.sql` | 최초 `halls` 테이블 (구 스키마) |
| 2 | `supabase/budgets.sql` | `budgets` 테이블 (5 고정 카테고리) |
| 3 | `supabase/realtime.sql` | `halls`/`budgets` publication 등록 |
| 4 | `supabase/halls_simplify.sql` | halls에 `guests`, `transport` 컬럼 추가 (구 컬럼은 남겨둠) |
| 5 | `supabase/budgets_total.sql` | `total` pseudo-category 허용 (CHECK 확장) |
| 6 | `supabase/budgets_custom.sql` | CHECK 제거 + `label` 컬럼 추가 (custom 항목 지원) |
| 7 | `supabase/budgets_icon.sql` | `icon` 컬럼 추가 + 구 `etc` 행 삭제 |
| 8 | `supabase/events.sql` | `events` 테이블 + realtime publication 등록 |
| 9 | `supabase/vendors.sql` | `studios`/`dresses`/`makeups` 3개 테이블 + realtime publication 등록 |

새 마이그레이션 추가 시 번호순으로 계속 이어가고, 파일 상단 주석에 dependency를 명시할 것.

---

## 다음 세션 작업 우선순위

이 목록은 다음 세션에서 이어서 할 수 있는 작업을 우선순위 순으로 정리한 것입니다. 각 항목은 독립적이라 원하는 것부터 골라 진행할 수 있습니다.

### 1. 동선 계산 실 구현
- 이유: 선택된 웨딩홀/스튜디오/드레스/메이크업을 기반으로 하루 투어 경로 제안
- 작업 규모: 크게 (API 선택에 따라 변동)
- 옵션:
  - **Kakao Map REST API** — 한국에 특화, 무료 티어 있음, 경로/거리/시간 제공
  - **Google Maps Directions API** — 더 정확하지만 결제 카드 필요
  - **간단 구현**: 하드코딩된 위도/경도 + Haversine 거리 공식, 시간 없이 거리만
- 필요 작업:
  - 주소 → 좌표 변환 (geocoding) 또는 수동 입력
  - 경로 최적화 알고리즘 (5~7 포인트 TSP, 브루트포스로 충분)
  - 타임라인 UI (다크 테마)
  - 각 정거장 간 이동 시간/거리 표시

### 2. Legacy 파일 삭제
- `RouteTab.tsx`, `CopyButton.tsx` 제거 (`HallCard.tsx`는 이미 삭제됨)
- 삭제 전 `grep -r` 로 사용처 재확인 (이미 미사용이지만 안전)
- `globals.css`의 warm-theme 전용 클래스들 (`.tl-*`, `.copy-btn` 등)도 같이 정리 가능

### 3. 기타 소규모 개선
- **body scroll lock**: 모바일 사이드바 드로어 열려있을 때 배경 스크롤 방지
- **ESC 키로 드로어 닫기**: 키보드 접근성
- **Supabase Presence API**: 상대방이 온라인인지 표시 ("wed2가 보고 있음")
- **예산 spent 필드**: 예산 대비 실제 지출 트래킹
- **로그인 세션 만료 시 자동 로그아웃 UI**: 현재는 새 요청 시 401 → 수동 재로그인
- **에러 바운더리**: `app/error.tsx` 추가해서 런타임 에러 핸들링
