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

## 현재 구현 상태 (2026-04-13 기준)

### 인증 & 기반
- **인증**: 2인 고정 계정 (`wed1`/`wed2`), bcrypt 해시, HMAC 쿠키 세션, Edge proxy 전역 보호
- **로그인 페이지**: Aceternity 스타일 오로라 배경 + 투명 글라스 카드 (민트/그린 팔레트)
- **WWP 브랜드 자산**: favicon, apple-icon, 로고 SVG, OpenGraph/Twitter 카드
- **Pretendard 폰트** (React 19 link hoisting)
- **에러 바운더리**: `app/error.tsx` — 런타임 에러 시 다크 테마 에러 화면 + "다시 시도" 버튼
- **`.env.local`의 `$` escape 규칙** (backend skill convention에 문서화)

### 대시보드 Shell
- 좌측 사이드바 (데스크톱) / 햄버거 드로어 (모바일)
- 예식 그룹: 웨딩홀 / 스튜디오 / 드레스 / 메이크업
- 부동산 그룹: 자산 / 매물 / 임장 동선
- 결혼 예산 + custom 예산 항목 동적 탭 (My Items)
- **body scroll lock** (모바일 드로어 열림 시)
- **ESC 키로 드로어 닫기**

### Overview 섹션
- **StatusCards**: 웨딩홀/스튜디오/드레스/메이크업/예정 일정 실 카운트 + accent 표시
- **예산 도넛 차트**: 고정 카테고리 + custom 항목 모두 반영
- **월 캘린더**: 일정 있는 날짜 클릭 → 수정 모달
- **다가오는 일정 리스트**: D-day 표시, 클릭으로 수정, 우상단 "+ 일정 추가" 버튼

### 웨딩홀
- **CRUD**: Supabase `halls` 테이블 (8필드: name/sub/price/guests/parking/transport/note + id), 다크 카드 그리드, 정렬(가격/보증인원/주차), FAB 추가
- **URL 자동 채움**: `/api/fetch-preview` — OG/Twitter meta 파싱
- **동적 priceLevel dot**: 예산 대비 `computePriceLevel()` 로 🟢🟡🔴 표시
- **HallFormModal**: 다크 글라스 테마, 교통편 칩, 가격 등급 popover

### 스튜디오 · 드레스 · 메이크업 (vendors)
- **3개 테이블 공통 스키마**: `studios`/`dresses`/`makeups`, 드레스만 `target` (groom/bride)
- **Generic 컴포넌트**: `VendorFormModal` + `VendorListSection` 하나로 3섹션 커버
- **단일 동적 API**: `/api/vendors/[category]/...` (GET/POST/PUT/DELETE)
- **드레스 sub-tab**: 신부/신랑 필터 + 각 카운트, FAB로 추가

### 결혼 예산
- **Supabase `budgets` 테이블**: 4개 고정 카테고리 + `total` + `custom:*` 항목
- **총 예산 목표** + 배분 차액 (여유/초과 색상)
- **Custom 항목**: 이름/아이콘/금액, `BUDGET_ICONS` 24개 팔레트 아이콘 피커
- **편집 모드**: 체크박스 선택 삭제, 전체 선택, 확인 다이얼로그
- **사이드바 동적 탭**: custom 항목 → "My Items" 하위 탭
- **다크 커스텀 체크박스**: `peer` 패턴 기반, mint glow

### 캘린더 (events)
- **Supabase `events` 테이블**: date/title/type/time/location/memo
- **EventFormModal**: 타입 칩, 삭제 버튼
- **CRUD 진입점**: "+ 일정 추가" 버튼 + 카드/캘린더 날짜 클릭

### 신혼집 / 매물 (complexes) — 2026-04-12 추가
- **Supabase `complexes` 테이블**: 단지정보 (name/city/district/dong/yearUnits/area) + 가격정보 (salePrice/jeonsePrice/peakPrice/lowPrice/lastTradePrice) + 입지분석 (commuteTime/subwayLine/workplace1/2/schoolScore/hazard/amenities/isNewBuild/isCandidate) + note
- **ComplexFormModal**: 단지정보/가격정보/입지분석 섹션 분리, 후보 체크박스
- **HousingSection**: 카드 그리드, 정렬 (매매가/갭/이름), 전세비율/갭/고점 대비 하락 표시
- **유틸리티 함수**: `jeonseRatio()`, `gap()`, `dropFromPeak()`

### 자산 (assets) — 2026-04-12 추가
- **Supabase `assets` 테이블**: role (groom/bride UNIQUE) + 자산 (cash/stocks/savings/otherAssets) + 소득 (monthlyIncome/annualIncome) + 대출 심사 (age/isHomeless/homelessYears/isFirstHome/existingLoans/creditScore/netAssets) + note
- **AssetsSection**: 신랑/신부 자산 카드 병렬 배치, 요약 카드 (총 자산/연소득/부부합산)
- **upsert 패턴**: role 기반 2행 고정, `POST /api/assets`로 upsert
- **formatWon()**: 한국식 금액 포맷 (예: "5억 9,500만", "3,800만")

### 실시간 동기화
- **Supabase Realtime 단일 채널** (`wwp-shared`): 8개 테이블 리스너 — halls / budgets / events / studios / dresses / makeups / complexes / assets
- **BudgetSection 충돌 머지**: category-keyed baseline merge

### 공통 디자인
- 전역 다크 글라스 테마 (`bg-[#020806]`, white overlay)
- 커스텀 스크롤바 (6px 얇은 흰색, hover 시 밝아짐)
- `<input type="number">` 스피너 전역 숨김
- 브랜드 민트(#00FFE1) 일관 강조
- **Legacy warm 테마 CSS 전량 삭제** (2026-04-13): `globals.css` 700줄+ 제거 — `.modal-*`, `.form-*`, `.btn-*`, `.card-*`, `.tl-*`, `.copy-btn`, `.route-*`, `.filter-*`, `.badge`, `.info-*`, `.fab`, `:root` warm vars 등

### 임장 동선 (housing-routes) — 2026-04-13 구현
- **네이버 지도 API**: Geocoding (주소→좌표) + Directions 5 (경로 계산) — `/api/naver/geocode`, `/api/naver/directions` 서버 프록시
- **네이버 지도 SDK (v3)**: 클라이언트 `<Script>` 동적 로드, 지도 위 경로 폴리라인 + 번호 마커
- **HousingRouteSection**: 매물 체크박스 선택 → "경로 계산" → 지도 시각화 + 구간별 거리/시간 타임라인
- **API Keys**: `.env.local` — `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` + `NAVER_MAP_CLIENT_SECRET`
- **타입 선언**: `src/types/navermaps.d.ts` (naver.maps SDK 최소 타입)

### Legacy — 전부 정리 완료 (2026-04-13)
- `HallCard.tsx` — 삭제됨 (2026-04-10)
- `RouteTab.tsx` + `CopyButton.tsx` — 삭제됨 (2026-04-13)
- `halls.ts`의 `routeItems` / `RouteStop` / `RouteDrive` legacy export — 삭제됨 (2026-04-13)
- `globals.css` warm 테마 클래스 (~700줄) + `:root` warm vars + `@theme` warm palette — 삭제됨 (2026-04-13)

---

## 개발 환경 / 인프라

### Supabase 프로젝트
- **Project ref**: `veaktwkvuuuhmcxgvdeh`
- **Region**: `ap-northeast-1` (도쿄 — Supabase에 서울 리전 없음)
- **URL**: `https://veaktwkvuuuhmcxgvdeh.supabase.co`
- **테이블 (총 8개)**: `halls`, `budgets`, `events`, `studios`, `dresses`, `makeups`, `complexes`, `assets`
- **RLS**: 전부 disabled — 액세스는 Next.js proxy에서 쿠키 세션 기반으로 차단
- **Realtime publication (`supabase_realtime`)**: 위 8개 테이블 전부 포함

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
| 10 | `supabase/complexes.sql` | `complexes` 테이블 (신혼집 매물 비교) |
| 11 | `supabase/assets.sql` | `assets` 테이블 (신랑/신부 자산, role UNIQUE + 초기 2행 seed) |

새 마이그레이션 추가 시 번호순으로 계속 이어가고, 파일 상단 주석에 dependency를 명시할 것.

---

## 다음 세션 작업 우선순위

이 목록은 다음 세션에서 이어서 할 수 있는 작업을 우선순위 순으로 정리한 것입니다. 각 항목은 독립적이라 원하는 것부터 골라 진행할 수 있습니다.

### 1. 기타 소규모 개선
- **Supabase Presence API**: 상대방이 온라인인지 표시 ("wed2가 보고 있음")
- **예산 spent 필드**: 예산 대비 실제 지출 트래킹
- **로그인 세션 만료 시 자동 로그아웃 UI**: 현재는 새 요청 시 401 → 수동 재로그인
