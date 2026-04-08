# Frontend Convention

프론트엔드 작업 시 따라야 할 구체적인 컨벤션과 코드 패턴. `SKILL.md`가 "무엇을/왜"를 다룬다면 이 문서는 "어떻게"를 다룬다.

## 파일 & 디렉토리

### 경로 규칙

```
src/
├── app/
│   ├── layout.tsx                    루트 레이아웃 (Server Component)
│   ├── page.tsx                      루트 페이지
│   ├── globals.css                   전역 CSS + Tailwind v4 @theme
│   ├── login/
│   │   └── page.tsx                  /login 페이지 (Client Component)
│   └── components/
│       ├── WeddingApp.tsx            메인 앱 진입 컴포넌트
│       ├── HallCard.tsx
│       ├── HallFormModal.tsx
│       ├── RouteTab.tsx
│       ├── CopyButton.tsx
│       └── ui/                       공통 재사용 컴포넌트
│           └── TwEmoji.tsx
```

### 파일 이름 규칙

- **컴포넌트 파일**: `PascalCase.tsx` (예: `HallCard.tsx`)
- **페이지 파일**: `page.tsx` (Next.js App Router 규칙)
- **레이아웃 파일**: `layout.tsx`
- **CSS 파일**: `kebab-case.css` 또는 `globals.css`
- **데이터 파일**: `camelCase.ts` (예: `halls.ts`)

### 임포트 순서

컴포넌트 파일 상단의 임포트는 아래 순서를 따른다:

```tsx
// 1. "use client" (클라이언트 컴포넌트일 때만)
"use client";

// 2. React / Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 3. 외부 라이브러리
import { createClient } from "@supabase/supabase-js";

// 4. 내부 절대 경로 (@/ alias)
import { WeddingHall } from "@/data/halls";

// 5. 상대 경로
import HallCard from "./HallCard";
import TwEmoji from "./ui/TwEmoji";
```

## 컴포넌트 작성

### 기본 뼈대 (Server Component)

```tsx
import TwEmoji from "./ui/TwEmoji";

interface Props {
  title: string;
  description?: string;
}

export default function ExampleCard({ title, description }: Props) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <h3 className="text-[var(--ink)] font-semibold">
        <TwEmoji emoji="✨" size={16} /> {title}
      </h3>
      {description && (
        <p className="text-xs text-[var(--ink2)] mt-2">{description}</p>
      )}
    </div>
  );
}
```

### 클라이언트 컴포넌트 (상태/이벤트 필요할 때만)

```tsx
"use client";

import { useState } from "react";

interface Props {
  initial: number;
}

export default function Counter({ initial }: Props) {
  const [count, setCount] = useState(initial);

  return (
    <button
      onClick={() => setCount((c) => c + 1)}
      className="px-4 py-2 bg-[var(--gold)] text-white rounded-lg"
    >
      {count}
    </button>
  );
}
```

### 금지 패턴

```tsx
// 인라인 스타일
<div style={{ marginTop: 10 }}>          // 금지
<div className="mt-2.5">                 // OK

// 직접 이모지
<h1>💍 Title</h1>                         // 금지
<h1><TwEmoji emoji="💍" size={20} /> Title</h1>  // OK

// 인라인 props 타입
function Card({ title }: { title: string }) {}   // 금지
interface Props { title: string }
function Card({ title }: Props) {}                // OK

// any
function handler(e: any) {}              // 금지
function handler(e: unknown) {}           // OK (필요하면 narrowing)
function handler(e: React.MouseEvent) {} // OK (구체 타입이 있을 때)

// 불필요한 "use client"
"use client";
export default function Static() { return <div>Hello</div>; }  // 금지 — 제거

// interface 빈 선언
interface Props {}                        // 금지 — 아예 생략
```

## 스타일링

### 우선순위

1. **기존 CSS 클래스 (`globals.css`)** — 같은 시각 패턴이 이미 있으면 재사용
2. **Tailwind 유틸리티** — 일반적인 spacing/layout
3. **Tailwind arbitrary values** — 프로젝트 CSS 변수 사용 시
4. **globals.css에 새 클래스 추가** — 2회 이상 반복될 때만

### 색상 토큰 (Tailwind arbitrary value)

| 역할 | 토큰 | 사용 예 |
|---|---|---|
| 배경 | `var(--bg)` | `bg-[var(--bg)]` |
| 카드 배경 | `var(--card)` | `bg-[var(--card)]` |
| 기본 텍스트 | `var(--ink)` | `text-[var(--ink)]` |
| 보조 텍스트 | `var(--ink2)` | `text-[var(--ink2)]` |
| 비활성 텍스트 | `var(--ink3)` | `text-[var(--ink3)]` |
| 브랜드 (금) | `var(--gold)` | `text-[var(--gold)]` `bg-[var(--gold)]` |
| 금 배경(연함) | `var(--gold-light)` | `bg-[var(--gold-light)]` |
| 성공 (초록) | `var(--green)` | `text-[var(--green)]` |
| 경고 (호박) | `var(--amber)` | `text-[var(--amber)]` |
| 에러 (빨강) | `var(--red)` | `text-[var(--red)]` |
| 테두리 | `var(--border)` | `border-[var(--border)]` |
| 라운드 | `var(--radius)` | `rounded-[var(--radius)]` |

### 기존 CSS 클래스 인벤토리

`globals.css`에 정의된 주요 클래스 (재구현 금지):

- **카드**: `card`, `card.best`, `card-body`, `card-head`, `card-title`, `card-sub`, `card-img`, `img-placeholder`
- **가격 배지**: `price-box`, `price-label`, `price-val`, `price-ok`, `price-warn`, `price-over`
- **뱃지**: `badges`, `badge`, `b-gold`, `b-green`, `b-red`, `b-amber`, `b-gray`
- **정보 그리드**: `info-grid`, `info-grid.three`, `info-cell`, `info-lbl`, `info-val`
- **교통/노트/견적**: `ktx-row`, `ktx-row.warn`, `note`, `note.warn`, `note.danger`, `calc-wrap`, `calc-title`, `calc-row`, `calc-row.total`
- **필터/요약**: `filter-wrap`, `filter-btn`, `filter-btn.active`, `summary`, `sum-item`, `sum-label`, `sum-val`
- **탭**: `tab-nav`, `tab-btn`, `tab-btn.active`
- **동선 타임라인**: `route-wrap`, `route-header`, `route-total`, `timeline`, `tl-stop`, `tl-marker`, `tl-dot`, `tl-dot.start`, `tl-dot.end`, `tl-line`, `tl-card`, `tl-card-head`, `tl-name`, `tl-price`, `tl-addr`, `tl-meta`, `tl-tag`, `tl-tip`, `tl-connector`, `tl-drive`, `tl-drive-line`
- **복사 버튼**: `copy-btn`, `copy-btn.copied`
- **모달**: `modal-overlay`, `modal-content`, `modal-header`, `modal-close`, `modal-body`, `modal-footer`
- **폼**: `form-section`, `form-section-title`, `form-grid`, `form-group`, `form-group.full`, `checkbox-label`
- **버튼**: `btn-add`, `btn-remove`, `btn-cancel`, `btn-save`, `fab`, `card-actions`, `card-actions .btn-delete`
- **기타**: `section-divider`, `twemoji`, `best-banner`

### 조건부 클래스네임

인라인 style을 조건부로 쓰는 대신, 클래스네임을 조건부로 조립한다.

```tsx
// 문자열 템플릿 방식
<div className={`card${hall.isBest ? " best" : ""}`}>

// 배열 + join 방식 (여러 조건)
const cardClass = [
  "tl-card",
  stop.type === "start" ? "border-l-[3px] border-l-[var(--green)]" : "",
  stop.isBest ? "border-2 border-[var(--gold)]" : "",
]
  .filter(Boolean)
  .join(" ");
```

## 타입스크립트

### `any` 회피 전략

| 상황 | 해결법 |
|---|---|
| catch된 에러 | `catch (e: unknown)` + `e instanceof Error` |
| JSON 응답 | `unknown`으로 받고 타입 가드로 좁히기 |
| 이벤트 핸들러 | `React.MouseEvent<HTMLButtonElement>` 같은 구체 타입 |
| 외부 라이브러리 반환값 | 해당 라이브러리의 제공 타입 사용 |
| 제네릭 유틸 | 제네릭 파라미터 `<T>` 사용 |

### Props 선언 규칙

```tsx
// 단일 파일 내 유일한 컴포넌트면 Props로
interface Props {
  hall: WeddingHall;
  onEdit: (hall: WeddingHall) => void;
}

// 한 파일에 여러 컴포넌트면 각각 XxxProps
interface HallCardProps { /* ... */ }
interface HallCardActionsProps { /* ... */ }
```

## 성능/접근성 체크포인트

- **`<img>` 태그**: Next.js는 `next/image` 사용을 권장하지만, 외부 CDN 이미지(Twemoji 등)는 `<img>` + `eslint-disable-next-line @next/next/no-img-element` 주석으로 허용.
- **alt 속성**: 모든 `<img>`는 의미 있는 `alt`를 가진다. TwEmoji는 기본으로 emoji 문자 자체를 alt로 사용.
- **키보드 접근성**: `onClick`만 있는 `<div>` 대신 `<button>`을 쓴다.
- **입력 필드**: `<input>`에 적절한 `autoComplete`, `type` 지정.

## 작업 전 체크리스트

1. `CLAUDE.md` 읽기 (세션 첫 작업이면 필수)
2. 수정할 파일을 Read로 전체 읽기 (부분 수정이라도 맥락 파악)
3. `components/ui/`에 재사용할 수 있는 컴포넌트가 있는지 확인
4. `globals.css`에 동일 시각 패턴의 기존 클래스가 있는지 확인
5. 변경 범위가 요청된 수준을 넘지 않는지 확인 (drive-by 리팩토링 금지)

## 작업 후 체크리스트

1. `style={{}}` 0개
2. 직접 이모지 문자 0개 (문자열 데이터 예외 제외)
3. 모든 Props가 `interface`로 선언됨
4. `any` 0개
5. `"use client"`가 필요 없는 곳에 붙어있지 않음
6. 새로 만든 공통 컴포넌트가 있으면 `CLAUDE.md` 인벤토리 업데이트
