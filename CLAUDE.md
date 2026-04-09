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
