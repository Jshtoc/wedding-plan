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

## 현재 구현 상태 (2026-04-09 기준)

### 완료
- **인증**: 2인 고정 계정 (`wed1`/`wed2`), bcrypt 해시, HMAC 쿠키 세션, Edge proxy 전역 보호
- **로그인 페이지**: Aceternity 스타일 오로라 배경 + 투명 글라스 카드 (민트/그린 팔레트)
- **대시보드 shell**: 좌측 사이드바 (데스크톱) / 햄버거 드로어 (모바일), 7개 섹션
- **Overview 섹션**: 상태 카드 + 월 캘린더 + 다가오는 일정 + 예산 도넛 차트
- **웨딩홀 CRUD**: Supabase `halls` 테이블, 다크 카드 그리드, 정렬, 수정/삭제, FAB 추가
- **웨딩홀 URL 자동 채움**: `/api/fetch-preview` — OG/Twitter meta 파싱
- **결혼 예산**: Supabase `budgets` 테이블, 5개 카테고리 편집 + 도넛 차트 + 진행 바
- **실시간 동기화**: Supabase Realtime으로 `halls` + `budgets` 양방향 sync, 편집 중 충돌 머지
- **WWP 브랜드 자산**: favicon, apple-icon, 로고 SVG, OpenGraph/Twitter 카드
- **Pretendard 폰트** (React 19 link hoisting)
- **`.env.local`의 `$` escape 규칙** (backend skill convention에 문서화)

### 진행 중 / Stub 상태
- **스튜디오 · 드레스 · 메이크업** 섹션 — EmptyState placeholder만 존재, 데이터 모델 미구현
- **동선 계산** — EmptyState placeholder, 기존 `RouteTab`은 legacy (미사용)
- **캘린더 이벤트** — `SAMPLE_EVENTS` 하드코딩 (OverviewSection.tsx 상단). DB 미연동
- **HallFormModal** — 여전히 warm 테마. 다른 섹션은 다크인데 모달만 흰색

### Legacy / 삭제 후보
- `src/app/components/HallCard.tsx` — warm 테마 기존 구현, `WeddingApp.tsx`에서 더 이상 import 안 함
- `src/app/components/RouteTab.tsx` — warm 테마 기존 투어 동선, 미사용
- `src/app/components/CopyButton.tsx` — RouteTab 전용, 미사용
- 삭제 전에 사용처 재확인 (`grep -r "HallCard\|RouteTab\|CopyButton" src/` 로 확인)

---

## 다음 세션 작업 우선순위

이 목록은 다음 세션에서 이어서 할 수 있는 작업을 우선순위 순으로 정리한 것입니다. 각 항목은 독립적이라 원하는 것부터 골라 진행할 수 있습니다.

### 1. HallFormModal 다크 테마 리디자인
- 이유: 현재 앱 전체가 다크 오로라 톤인데 웨딩홀 등록/수정 모달만 warm (흰색 배경 + cream). 시각적으로 튐
- 작업 규모: 중간 (300줄 정도 리스타일). `design/convention.md`의 다크 폼 패턴 참조
- 연관 파일: `src/app/components/HallFormModal.tsx`, `globals.css`의 `.modal-*`, `.form-*` 클래스
- 접근: Tailwind 다크 유틸리티로 교체하고 warm 클래스는 남기되 사용만 안 하는 방식

### 2. events 테이블 + 캘린더 CRUD
- 이유: 현재 `OverviewSection.tsx`의 `SAMPLE_EVENTS`는 하드코딩. DB화하면 양 사용자가 일정 추가/편집 가능
- 작업 규모: 중간
- 필요 작업:
  - `supabase/events.sql` 테이블 스키마 (id, date, title, type, time, location, memo, created_at)
  - `src/data/events.ts` 타입 이동
  - `src/lib/db.ts` — `getEvents`, `createEvent`, `updateEvent`, `deleteEvent`
  - `src/app/api/events/route.ts` + `[id]/route.ts`
  - `EventFormModal` 컴포넌트 (다크 테마)
  - `OverviewSection`에서 fetch로 전환
  - Realtime publication에 `events` 추가 (`supabase/realtime.sql`에 ALTER PUBLICATION 한 줄)
  - WeddingApp의 realtime 구독 채널에 events 리스너 추가

### 3. 스튜디오 · 드레스 · 메이크업 실제 CRUD
- 이유: 사이드바 메뉴는 있지만 모두 placeholder
- 작업 규모: 크게 — 세 섹션이 비슷한 패턴이라 공통화하면 줄어듦
- 전략:
  - 데이터 구조가 halls와 비슷해서 **제네릭 섹션 패턴** 추출을 먼저 해볼 것
  - 예: `<CategoryListSection entity="studio">` 같이 props로 카테고리 받는 단일 컴포넌트
  - 또는 세 섹션을 halls의 복사본으로 시작해서 개별 진화
  - 드레스는 신랑/신부 sub-tab 구조 유지 필요
- 필요 작업 (각 카테고리당):
  - Supabase 테이블 스키마
  - 타입 정의 (`src/data/studios.ts` 등)
  - db.ts 함수들
  - API 라우트
  - 섹션 컴포넌트 (카드 그리드 + 정렬 + FAB)
  - 폼 모달 (다크 테마로 — 1번 작업 완료 후 진행하면 재사용 가능)
  - Realtime publication 등록

### 4. 동선 계산 실 구현
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

### 5. Legacy 파일 삭제
- `HallCard.tsx`, `RouteTab.tsx`, `CopyButton.tsx` 제거
- 삭제 전 `grep -r` 로 사용처 재확인 (이미 미사용이지만 안전)
- `globals.css`의 warm-theme 전용 클래스들 (`.tl-*`, `.copy-btn` 등)도 같이 정리 가능

### 6. 기타 소규모 개선
- **body scroll lock**: 모바일 사이드바 드로어 열려있을 때 배경 스크롤 방지
- **ESC 키로 드로어 닫기**: 키보드 접근성
- **Supabase Presence API**: 상대방이 온라인인지 표시 ("wed2가 보고 있음")
- **예산 spent 필드**: 예산 대비 실제 지출 트래킹
- **로그인 세션 만료 시 자동 로그아웃 UI**: 현재는 새 요청 시 401 → 수동 재로그인
- **에러 바운더리**: `app/error.tsx` 추가해서 런타임 에러 핸들링
