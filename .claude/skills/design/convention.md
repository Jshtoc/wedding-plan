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

### Auth 팔레트 (로그인 전용, 다크 오로라)

```css
--color-mint:       #00FFE1;  /* 네온 민트-시안, 최고 하이라이트 + CTA 버튼 */
--color-green:      #10b981;  /* emerald-500, 오로라 메인 커튼 */
--color-dark-green: #064e3b;  /* emerald-900, 심층 대기 */
```

**Tailwind 유틸리티 예**:
- `bg-mint`, `text-mint`, `bg-mint/15`, `focus:ring-mint/20`, `focus:border-mint/80`
- `bg-green`, `bg-green/50`
- `bg-dark-green`, `bg-dark-green/80`

**대비 주의 (필수)**: `bg-mint` (#00FFE1)는 매우 밝은 네온톤이라 흰 텍스트와의 대비는 약 1.3:1로 완전 실패. **항상 `bg-mint text-gray-900`** (약 18:1)로 페어링할 것. CTA, 링크, 인터랙티브 텍스트 전부 동일.

**다크 팔레트 중립 색상**: 로그인 페이지는 다크 오로라 테마이므로 카드/인풋 배경은 흰색이 아닌 **투명 white 오버레이**를 씀:

| 용도 | 값 |
|---|---|
| 페이지 배경 | `bg-[#020806]` (near-black, 살짝 그린 틴트) |
| 글라스 카드 배경 | `bg-white/[0.04]` + `backdrop-blur-2xl` |
| 글라스 카드 테두리 | `border-white/10` |
| 인풋 배경 (rest) | `bg-white/[0.05]` |
| 인풋 배경 (focus) | `bg-white/[0.08]` |
| 인풋 테두리 (rest) | `border-white/15` |
| 인풋 테두리 (focus) | `border-mint/80` + `focus:ring-4 focus:ring-mint/20` |
| 본문 텍스트 | `text-white` |
| 서브 / 뮤트 | `text-white/50` ~ `text-white/60` |
| 라벨 | `text-mint` (버튼과 색 연결) |
| 에러 | `text-red-300` on `bg-red-500/10` + `border border-red-400/20` |

**배경 애니메이션 블롭 (auth-only)**: `globals.css`에 `float-a/b/c/d` 키프레임과 `--animate-float-a/b/c/d` 토큰이 정의되어 있어 `animate-float-a/b/c/d` Tailwind 유틸리티로 사용 가능. `SKILL.md`의 "Aurora background" 섹션에 완전한 패턴 코드 있음. 4개 블롭을 `mint` / `green` / `dark-green` 3 토큰 조합으로 배치 (그린 계열이 지배적). `prefers-reduced-motion` 대응 포함.

### 중립 색상 (gray 스케일)

라이트 테마이므로 흰색 오버레이 대신 Tailwind 기본 `gray-*` 팔레트를 사용:

| 용도 | 값 |
|---|---|
| 페이지 배경 | `bg-[#f5f5f7]` (아주 연한 쿨그레이) |
| 카드 배경 | `bg-white` |
| 본문 텍스트 | `text-gray-900` |
| 서브 텍스트 | `text-gray-700`, `text-gray-500` |
| 흐린 텍스트 | `text-gray-400` |
| placeholder | `text-gray-400` |
| 구분선 | `border-pearl` 또는 `border-gray-100` |
| 에러 박스 배경 | `bg-red-50` |
| 에러 박스 테두리 | `border-red-200` |
| 에러 텍스트 | `text-red-600` |

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

### Auth (라이트)

| 레벨 | 클래스 | 용도 |
|---|---|---|
| 1. 카드 | `shadow-[0_2px_24px_rgba(15,23,42,0.04)]` | 로그인 카드 (아주 은은) |
| 2. 버튼 CTA | `shadow-[0_6px_20px_-4px_rgba(0,255,225,0.55)]` | mint 제출 버튼 (네온 민트 glow) |

**팁**: 브랜드 색(mint, gold)을 낮은 알파로 섞은 shadow를 쓰면 CTA가 떠 있는 느낌을 줍니다. 너무 남용하면 촌스러워지니 메인 액션 버튼에만.

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

**Auth 버튼 (mint, 네온 glow)**
```tsx
<button className="w-full h-[60px] bg-mint text-gray-900 rounded-2xl text-base font-semibold tracking-tight transition-all hover:bg-mint/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_6px_20px_-4px_rgba(0,255,225,0.55)]">
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

**Auth (light, minimal)**
```tsx
<div>
  <label htmlFor="login-id" className="block text-sm font-semibold text-jade mb-2.5">
    아이디
  </label>
  <input
    id="login-id"
    className="w-full h-[60px] px-6 text-base bg-white border border-pearl rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20 transition-all"
  />
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

**Auth (light)**
```tsx
<form className="w-full max-w-[440px] bg-white border border-pearl/70 rounded-3xl p-10 sm:p-12 shadow-[0_2px_24px_rgba(15,23,42,0.04)]">
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

**Auth (light)**
```tsx
<div className="flex items-start gap-2.5 text-[13px] text-red-600 bg-red-50 border border-red-200 px-5 py-4 rounded-xl">
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

### 브랜드 아이콘 (장식용 이모지 프레임)

**Auth (mint tint, 라이트 테마)**
```tsx
<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mint/15">
  <TwEmoji emoji="💍" size={28} />
</div>
```

**Warm (gold tint)**
```tsx
<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-light">
  <TwEmoji emoji="💍" size={28} />
</div>
```

사이즈 변형: `w-12 h-12` (48px) / `w-14 h-14` (56px) / `w-16 h-16` (64px) / `w-20 h-20` (80px). `rounded-2xl` (16px) 정사각 프레임이 현재 스타일. 원형이 필요하면 `rounded-full`.

### 구분선

**얇은 라인 (auth)**
```tsx
<div className="mt-8 pt-6 border-t border-pearl">
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
<div className="bg-[#14b8a6] text-[#e5e7eb]">...</div>

// ✅ 토큰 사용
<div className="bg-mint text-gray-900 border-pearl">...</div>
```

```tsx
// ❌ 한 페이지에 두 팔레트 혼용
<div className="bg-bg">
  <button className="bg-mint">로그인</button>  {/* 왜 mint?? 메인 팔레트엔 어울리지 않음 */}
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
    ├─ 본문 텍스트 → text-gray-900 / gray-700 / gray-500 / gray-400
    ├─ 페이지 배경 → bg-[#f5f5f7] (쿨그레이) 또는 bg-white
    ├─ 카드 배경 → bg-white
    ├─ 라벨 / 악센트 → text-jade
    ├─ CTA 버튼 → bg-mint text-gray-900 (대비 위해 어두운 텍스트 필수)
    ├─ 인풋 테두리 → border-pearl, focus:border-mint focus:ring-mint/20
    └─ 에러 → text-red-600 / bg-red-50 / border-red-200
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
