# Design Convention

디자인 작업 시 참조할 구체적인 토큰 값, 코드 템플릿, do/don't 예시. `SKILL.md`가 원칙을 다룬다면 이 문서는 구체 수치와 코드 조각을 제공합니다.

## 목차

1. [색상 토큰 전체](#색상-토큰-전체)
2. [타이포그래피 스케일](#타이포그래피-스케일)
3. [spacing 스케일](#spacing-스케일)
4. [radius 스케일](#radius-스케일)
5. [shadow 카탈로그](#shadow-카탈로그)
6. [컴포넌트 패턴 카탈로그](#컴포넌트-패턴-카탈로그)
7. [인터랙션 상태 치트시트](#인터랙션-상태-치트시트)
8. [TwEmoji 사이즈 가이드](#twemoji-사이즈-가이드)
9. [do / don't 예시](#do--dont-예시)
10. [자주 하는 결정 트리](#자주-하는-결정-트리)

## 색상 토큰 전체

정의 위치: `src/app/globals.css`의 `@theme { ... }` 블록.

### 메인 팔레트 (따뜻한 웨딩 테마)

```css
--color-bg: #f7f4f0;          /* 페이지 배경 (크림) */
--color-card: #ffffff;        /* 카드 surface */
--color-ink: #1a1714;         /* 기본 텍스트 */
--color-ink2: #6b6560;        /* 보조 텍스트 */
--color-ink3: #a39e99;        /* 흐린 텍스트, placeholder */
--color-gold: #b8935a;        /* 브랜드 악센트 */
--color-gold-light: #f5ede0;  /* 연한 금 surface */
--color-green: #3a7d5e;       /* 성공 / 저가 */
--color-green-light: #e8f5ee;
--color-red: #c0392b;         /* 에러 / 초과 */
--color-red-light: #fdecea;
--color-amber: #b8721a;       /* 경고 / 주의 */
--color-amber-light: #fdf3e3;
--color-border: #e8e2da;      /* 기본 테두리 */
```

**Tailwind 유틸리티 예**:
- `bg-bg`, `bg-card`, `bg-gold-light`
- `text-ink`, `text-ink2`, `text-ink3`, `text-gold`, `text-green`, `text-red`, `text-amber`
- `border-border`, `border-gold`, `border-red`
- 불투명도 조합: `bg-gold/10`, `text-ink2/80`, `border-gold/60`

### Auth 팔레트 (로그인 전용)

```css
--color-night: #1a1140;   /* 가장 어두운 보라, 배경 베이스 */
--color-royal: #3a2370;   /* 중간 보라, 카드/그라데이션 */
--color-mint:  #8ee5d5;   /* 민트, 악센트 & 포커스 */
```

**Tailwind 유틸리티 예**:
- `bg-night`, `bg-royal`, `bg-mint`
- `text-mint`, `text-white/70`, `text-white/50`
- `border-mint/60`, `border-white/10`, `border-white/15`
- 불투명도: `bg-royal/30`, `bg-mint/25`, `text-mint/70`

### 흰색 오버레이 (다크 배경 전용)

Auth 팔레트에서는 흰색을 낮은 알파로 다양한 표면/테두리에 사용:

| 용도 | 값 |
|---|---|
| 카드 배경 (glass) | `bg-white/[0.06]` ~ `bg-white/[0.08]` |
| 인풋 배경 (rest) | `bg-white/[0.04]` |
| 인풋 배경 (focus) | `bg-white/[0.08]` |
| 카드 테두리 | `border-white/10` |
| 인풋 테두리 | `border-white/15` |
| 구분선 | `border-white/10` |
| 본문 텍스트 | `text-white/70` |
| 흐린 텍스트 | `text-white/50`, `text-white/40` |
| placeholder | `text-white/30` |

## 타이포그래피 스케일

폰트는 **Pretendard Variable** 하나만 사용. weight 범위는 45~920 (Pretendard Variable 특성).

### 사이즈 / 용도 매핑

| 클래스 | 픽셀 | 용도 |
|---|---|---|
| `text-[10px]` | 10px | 뱃지 라벨, eyebrow 태그 (WEDDING PLAN) |
| `text-[11px]` | 11px | 힌트, 푸터 텍스트, 작은 태그 |
| `text-xs` | 12px | 라벨, 서브 텍스트, 보조 정보 |
| `text-[13px]` | 13px | 작은 본문, 에러 메시지 |
| `text-sm` | 14px | 일반 본문, 버튼 텍스트 |
| `text-base` | 16px | **인풋 필드 (iOS zoom 방지 필수)**, 강조 본문 |
| `text-lg` | 18px | 섹션 헤더 |
| `text-xl` | 20px | 페이지 타이틀 |
| `text-2xl` | 24px | 로그인 헤더, 히어로 타이틀 |
| `text-3xl` / `text-4xl` | 30px / 36px | 데스크톱 히어로 (절제해서) |

### weight / 용도

| 클래스 | weight | 용도 |
|---|---|---|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 라벨, 버튼 텍스트, 강조 본문 |
| `font-semibold` | 600 | 타이틀, 카드 제목, 로그인 헤더 |
| `font-bold` | 700 | 히어로 헤딩 (드물게) |

### tracking (letter-spacing)

| 클래스 | 용도 |
|---|---|
| 기본 (없음) | 대부분 |
| `tracking-tight` | 큰 헤딩 |
| `tracking-wide` | 라벨, 캡션 |
| `tracking-[0.25em]` / `tracking-[0.3em]` | eyebrow 태그 (대문자) |

### 행간

- **기본** (leading-normal) — 대부분
- `leading-tight` — 큰 헤딩, 2-line 타이틀
- `leading-relaxed` — 긴 본문, 힌트, 설명 텍스트

## spacing 스케일

Tailwind 기본 스페이싱 스케일 중 아래 값만 사용. 임의 픽셀 값 (`mt-[15px]` 등) 금지.

### 권장 사용값

```
0.5 = 2px   (아주 작은 gap)
1   = 4px
1.5 = 6px
2   = 8px   ← label-input gap
2.5 = 10px  ← 살짝 넓힌 label-input gap
3   = 12px
4   = 16px  ← 기본 카드 padding
5   = 20px
6   = 24px  ← 중간 카드 padding, 필드 간 간격
7   = 28px
8   = 32px  ← 넓은 카드 padding, 섹션 간 간격
9   = 36px
10  = 40px  ← 매우 넓은 섹션 간격, 로그인 카드 padding
12  = 48px  ← outer vertical padding
```

### 맥락별 권장 값

| 맥락 | 권장 |
|---|---|
| 라벨 ↔ 인풋 | `mb-2` 또는 `mb-2.5` |
| 아이콘 ↔ 텍스트 | `gap-2` |
| 폼 필드 그룹 사이 | `mb-5` 또는 `mb-6` |
| 마지막 필드 ↔ 제출 버튼 | `mb-6` 또는 `mb-8` |
| 섹션 ↔ 섹션 (카드 내부) | `mb-8` 또는 `mb-10` |
| 카드 내부 padding (일반) | `p-6` |
| 카드 내부 padding (넓게) | `p-8 sm:p-10` |
| 카드 내부 padding (컴팩트 리스트 아이템) | `p-3` 또는 `p-4` |
| 섹션 vertical | `py-10` / `py-12` |
| 에러 박스 padding | `px-3.5 py-3` 또는 `px-4 py-3` |

### 반응형 padding

모바일은 여유 줄이고 데스크톱은 여유 늘리기:
- `p-6 sm:p-8` — 표준
- `p-8 sm:p-10` — 넓은 카드
- `px-5 py-10` → `px-8 py-12` 등

## radius 스케일

| 클래스 | 용도 |
|---|---|
| `rounded-full` | 원형 아이콘 배경, 오브, 배지 |
| `rounded-[20px]` | 태그, pill 배지 |
| `rounded-lg` (8px) | 작은 버튼, info-cell, 노트 박스 |
| `rounded-[10px]` | 작은 카드 (레거시 `--radius`와 구분) |
| `rounded-xl` (12px) | 버튼, 인풋, 에러 박스 |
| `rounded-[var(--radius)]` (16px) | 기본 카드 (warm) |
| `rounded-2xl` (16px) | 동일 |
| `rounded-3xl` (24px) | 히어로 카드 |
| `rounded-[28px]` | Auth 카드 (더 부드러운 곡률) |

**규칙**: 한 페이지에 3개 이상의 radius 값 섞어 쓰지 않기. 시각적으로 산만해집니다.

## shadow 카탈로그

### Warm (메인 앱)

| 레벨 | 클래스 | 용도 |
|---|---|---|
| 0. 없음 | (그림자 없음) | info-cell, 인라인 배지 |
| 1. 은은함 | `shadow-[0_4px_20px_rgba(0,0,0,0.04)]` | 쉬고 있는 카드 |
| 2. 뚜렷함 | `shadow-[0_12px_40px_-12px_rgba(26,23,20,0.15)]` | floating 카드, CTA |
| 3. 모달 | `shadow-[0_24px_60px_-20px_rgba(0,0,0,0.3)]` | 모달, FAB |

### Auth (다크)

| 레벨 | 클래스 | 용도 |
|---|---|---|
| 1. 카드 깊이 | `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]` | 로그인 카드 |
| 2. 오브 글로우 | `shadow-[0_16px_40px_-12px_rgba(142,229,213,0.5)]` | 브랜드 오브 |
| 3. 버튼 글로우 | `shadow-[0_8px_24px_-8px_rgba(142,229,213,0.5)]` | 민트 제출 버튼 |

**팁**: 브랜드 색(민트, 골드)을 낮은 알파로 섞은 shadow를 쓰면 요소가 발광하는 느낌을 줄 수 있습니다. 너무 남용하면 촌스러워지니 CTA에만.

## 컴포넌트 패턴 카탈로그

### 버튼

**메인 버튼 (warm, dark)**
```tsx
<button className="w-full h-12 bg-ink text-white rounded-xl text-base font-medium transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
  제출
</button>
```

**메인 버튼 (warm, gold 악센트)**
```tsx
<button className="h-11 px-6 bg-gold text-white rounded-xl text-sm font-medium transition-colors hover:bg-gold/90 active:scale-[0.98]">
  추천 예식장 보기
</button>
```

**Auth 버튼 (민트)**
```tsx
<button className="w-full h-12 bg-mint text-night rounded-xl text-base font-semibold tracking-tight transition-all hover:bg-mint/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(142,229,213,0.5)]">
  로그인
</button>
```

**Ghost 버튼 (다크 배경 위)**
```tsx
<button className="bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer">
  로그아웃
</button>
```

**Icon 버튼 (작음)**
```tsx
<button className="w-8 h-8 flex items-center justify-center rounded-full bg-bg border border-border text-ink2 hover:bg-border transition-colors">
  <TwEmoji emoji="✏️" size={14} />
</button>
```

### 인풋

**메인 (warm)**
```tsx
<div>
  <label className="block text-xs font-medium text-ink2 mb-2">아이디</label>
  <input
    className="w-full h-12 px-4 text-base bg-bg border border-border rounded-xl text-ink placeholder:text-ink3 focus:outline-none focus:border-gold focus:bg-white transition-colors"
  />
</div>
```

**Auth (dark, glass)**
```tsx
<div>
  <label className="block text-[11px] font-medium text-white/70 mb-2.5 tracking-wide">아이디</label>
  <div className="relative">
    <input
      className="w-full h-12 pl-4 pr-12 text-base bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-mint/60 focus:bg-white/[0.08] transition-colors"
    />
    <div aria-hidden className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">
      <TwEmoji emoji="👤" size={18} />
    </div>
  </div>
</div>
```

### 카드

**메인 (warm)** — globals.css의 `.card` 클래스 활용 권장:
```tsx
<div className="card">
  <div className="card-body">
    ...
  </div>
</div>
```

직접 작성할 때:
```tsx
<div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
  ...
</div>
```

**Auth (dark, glass)**
```tsx
<form className="w-full max-w-md bg-royal/30 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
  ...
</form>
```

### 에러 박스

**메인 (warm)**
```tsx
<div className="flex items-start gap-2 text-[13px] text-red bg-red-light border border-red/20 px-3.5 py-3 rounded-xl">
  <TwEmoji emoji="⚠️" size={14} className="flex-shrink-0 mt-0.5" />
  <span className="leading-relaxed">{error}</span>
</div>
```

**Auth (dark)**
```tsx
<div className="flex items-start gap-2 text-[13px] text-rose-200 bg-rose-500/10 border border-rose-400/20 px-4 py-3 rounded-xl">
  <TwEmoji emoji="⚠️" size={14} className="flex-shrink-0 mt-0.5" />
  <span className="leading-relaxed">{error}</span>
</div>
```

### 배지 / 태그

메인 팔레트의 배지는 `globals.css`의 `.badge` + `.b-{color}` 클래스 사용 권장:
```tsx
<span className="badge b-gold">가격 1위</span>
<span className="badge b-green">KTX 접근성 ★★★★★</span>
<span className="badge b-red">보증 250명 주의</span>
```

인라인 작성이 필요한 경우:
```tsx
<span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-gold-light text-gold">
  추천
</span>
```

### 브랜드 오브 (장식용 원형 이모지 프레임)

```tsx
<div className="relative">
  <div aria-hidden className="absolute inset-0 rounded-full bg-mint/25 blur-xl" />
  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_16px_40px_-12px_rgba(142,229,213,0.5)]">
    <TwEmoji emoji="💍" size={36} />
  </div>
</div>
```

사이즈 변형: `w-16 h-16` (64px) / `w-20 h-20` (80px) / `w-24 h-24` (96px) / `w-40 h-40` (160px, 데스크톱 히어로)

### 구분선

**얇은 라인 (auth)**
```tsx
<div className="mt-8 pt-6 border-t border-white/10">
  ...
</div>
```

**라벨이 있는 구분선 (warm, globals.css의 `.section-divider`)**
```tsx
<div className="section-divider my-2">
  <span>추가 정보</span>
</div>
```

## 인터랙션 상태 치트시트

### 버튼

```tsx
className="
  /* rest */
  bg-ink text-white rounded-xl h-12 font-medium
  /* transition */
  transition-all
  /* hover */
  hover:bg-ink/90
  /* active */
  active:scale-[0.98]
  /* disabled */
  disabled:opacity-60 disabled:cursor-not-allowed
  /* focus (optional, 키보드 사용자) */
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold
"
```

### 인풋

```tsx
className="
  /* rest */
  h-12 px-4 text-base bg-bg border border-border rounded-xl text-ink
  placeholder:text-ink3
  /* focus */
  focus:outline-none focus:border-gold focus:bg-white
  /* transition */
  transition-colors
"
```

### 링크 / 클릭 가능 텍스트

```tsx
className="
  text-gold hover:text-gold/80 hover:underline
  transition-colors
"
```

## TwEmoji 사이즈 가이드

| 주변 텍스트 크기 | 권장 `size` prop |
|---|---|
| `text-[10px]` / `text-[11px]` | `12` |
| `text-xs` (12px) | `12` ~ `14` |
| `text-[13px]` / `text-sm` (14px) | `14` ~ `16` |
| `text-base` (16px) | `16` ~ `18` |
| `text-lg` (18px) | `18` ~ `20` |
| `text-xl` (20px) | `20` ~ `22` |
| `text-2xl` (24px) | `22` ~ `28` |
| 히어로 장식 | `32` ~ `80` |

**팁**: 버튼 내부 이모지는 텍스트 사이즈보다 **1~2px 작게**. 그래야 아이콘이 튀지 않고 텍스트와 조화.

## do / don't 예시

### 색상

```tsx
// ❌ 임의 hex
<div className="bg-[#8ee5d5] text-[#1a1140]">...</div>

// ✅ 토큰 사용
<div className="bg-mint text-night">...</div>
```

```tsx
// ❌ 한 페이지에 두 팔레트 혼용
<div className="bg-bg">
  <button className="bg-mint">로그인</button>  {/* 왜 민트?? */}
</div>

// ✅ 메인 팔레트로 통일
<div className="bg-bg">
  <button className="bg-ink text-white">로그인</button>
</div>
```

### Spacing

```tsx
// ❌ 임의 픽셀 값
<div className="mt-[13px] mb-[27px]">...</div>

// ✅ Tailwind 스케일
<div className="mt-3 mb-7">...</div>
```

```tsx
// ❌ 비일관적 rhythm (필드마다 다른 여백)
<div className="mb-3">...field 1...</div>
<div className="mb-5">...field 2...</div>
<div className="mb-[22px]">...field 3...</div>

// ✅ 일관된 rhythm
<div className="mb-6">...field 1...</div>
<div className="mb-6">...field 2...</div>
<div className="mb-6">...field 3...</div>
```

### Radius

```tsx
// ❌ 한 카드에 4개의 다른 radius
<div className="rounded-2xl p-4">
  <button className="rounded-lg">...</button>
  <div className="rounded-[7px]">...</div>
  <span className="rounded-full">...</span>
  <img className="rounded-md" />  {/* 너무 산만 */}
</div>

// ✅ 2~3개 내로 제한
<div className="rounded-[var(--radius)] p-4">
  <button className="rounded-xl">...</button>
  <span className="rounded-full">...</span>
</div>
```

### 인풋 폰트 사이즈

```tsx
// ❌ 14px 인풋 — iOS Safari가 focus 시 zoom-in
<input className="text-sm h-10 ..." />

// ✅ 16px 인풋 — iOS zoom 없음
<input className="text-base h-12 ..." />
```

### 터치 타겟

```tsx
// ❌ 너무 작은 버튼 — 모바일에서 누르기 어려움
<button className="h-8 px-2 text-xs">Edit</button>

// ✅ 44px 이상
<button className="h-11 px-4 text-sm">
  <TwEmoji emoji="✏️" size={14} /> 수정
</button>
```

### 인터랙션 상태

```tsx
// ❌ 상태 없음
<button className="bg-ink text-white rounded-xl px-4 py-2">Submit</button>

// ✅ hover/active/disabled
<button className="bg-ink text-white rounded-xl px-4 py-2 transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
  Submit
</button>
```

### 이모지

```tsx
// ❌ 직접 이모지 + 크기 불일치
<button className="text-sm">
  💍 완료
</button>

// ✅ TwEmoji + 적절한 사이즈
<button className="text-sm">
  <TwEmoji emoji="💍" size={14} /> 완료
</button>
```

## 자주 하는 결정 트리

### "이 요소의 색은 뭘로 하지?"

```
이 페이지는 어떤 팔레트인가?
├─ 메인 (웨딩 워크플로)
│   ├─ 텍스트라면 → text-ink / ink2 / ink3
│   ├─ 브랜드 악센트 → text-gold / bg-gold
│   ├─ 성공 / 저가 → text-green
│   ├─ 경고 → text-amber
│   ├─ 에러 → text-red
│   └─ 중립 배경 → bg-bg / bg-card
└─ Auth (/login)
    ├─ 텍스트라면 → text-white (투명도 조합)
    ├─ 배경 → bg-night / bg-royal / bg-royal/30
    ├─ 악센트 / CTA → bg-mint / text-mint
    └─ 에러 → text-rose-200 / bg-rose-500/10
```

### "이 요소의 radius는 뭘로 하지?"

```
요소 타입은?
├─ 태그 / pill → rounded-full
├─ 작은 인터랙션 (아이콘 버튼) → rounded-lg
├─ 표준 버튼 / 인풋 → rounded-xl
├─ info 카드 / 메모 박스 → rounded-lg (10px) 또는 rounded-xl
├─ 메인 카드 → rounded-[var(--radius)] (16px)
└─ 히어로 / 모달 → rounded-3xl 또는 rounded-[28px]
```

### "이 요소의 shadow는 뭘로 하지?"

```
떠 있어야 하는가?
├─ 아니다, 인라인이다 → shadow 없음
├─ 살짝 떠 있다 (쉬고 있는 카드) → subtle shadow
├─ 분명히 떠 있다 (callout, CTA) → prominent shadow
├─ 오버레이다 (모달) → modal shadow
└─ 발광해야 한다 (mint CTA 등) → brand-color glow shadow
```

### "새 색상 토큰을 추가해야 하나?"

```
이 색을 쓰는 곳이 3곳 이상인가?
├─ 아니다 → 기존 토큰 + 불투명도로 처리 or 임의값 1회용
└─ 그렇다 → 명확한 의미가 있는 이름을 지을 수 있나?
    ├─ 아니다 → 기존 토큰으로 쥐어짜기 (이름이 안 나오면 추상화가 덜 된 것)
    └─ 그렇다 → @theme에 추가 + 주석에 용도 설명
```

## 체크리스트 (디자인 작업 완료 전)

1. `SKILL.md`를 이 세션에 읽었는가
2. 색상은 전부 토큰 또는 Tailwind 기본 유틸리티 사용 (임의 hex 없음)
3. Spacing은 Tailwind 스케일 사용 (임의 픽셀 없음)
4. 타이포 사이즈는 정의된 스케일에서 선택
5. 인터랙티브 요소에 hover / focus / active / disabled 상태 있음
6. 터치 타겟 ≥ 44px (`h-11` 이상)
7. 인풋 폰트 사이즈 ≥ 16px (`text-base`)
8. 이모지는 `TwEmoji`로 렌더 + 주변 텍스트와 어울리는 사이즈
9. 동일 페이지 내 radius / shadow 일관성
10. 두 팔레트 (warm / auth) 를 한 페이지에 섞지 않음
11. `globals.css`의 기존 클래스 재사용 (`.card`, `.badge`, `.info-grid` 등)
12. 요청된 범위만 변경 (drive-by 리디자인 금지)
