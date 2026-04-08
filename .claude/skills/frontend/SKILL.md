---
name: frontend
description: Frontend implementation rules and conventions for this Next.js 16 (App Router) + Tailwind v4 + TypeScript project. Use this skill whenever the user asks you to build, modify, refactor, review, or fix anything that renders UI — pages, components, forms, layouts, styling, icons/emojis, fonts, or any file under src/app/ that produces JSX/TSX output. This covers creating new pages or components, adding features to existing ones, fixing visual/layout issues, deciding between server and client components, working with Tailwind classes, adding props/interfaces, and any change that touches how the user sees or interacts with the app. Trigger this skill even when the user doesn't explicitly say "frontend" — any task touching .tsx files in src/app/ (outside of src/app/api/) counts. Also trigger when the user describes a UI problem in plain terms like "이 화면이 이상해", "버튼 추가해줘", "스타일 바꿔", "컴포넌트 만들어줘".
---

# Frontend Skill

This skill encodes the rules, conventions, and decision-making patterns for frontend work in this wedding-plan project. These rules exist because the project has concrete constraints (Tailwind v4, Next.js App Router, Twemoji), and because consistency across components matters more than any individual stylistic preference.

Before starting, also read `CLAUDE.md` at the project root — it is the authoritative source of project-wide rules, and this skill is a more detailed companion to it.

For concrete code templates, file/directory conventions, the full CSS class inventory, and detailed code anti-patterns, read `convention.md` in this same skill directory. Refer to it whenever you're about to write a new component, touch an unfamiliar area, or are unsure about an idiomatic pattern.

## Tech stack

- **Next.js 16** with the App Router. All routing is file-based under `src/app/`.
- **React 19**.
- **TypeScript** in strict mode.
- **Tailwind CSS v4**, configured via `@theme` blocks inside `src/app/globals.css`. There is no `tailwind.config.ts`.
- **Twemoji** for all emoji rendering, via the `TwEmoji` component at `src/app/components/ui/TwEmoji.tsx`.
- **Pretendard** as the default font family, exposed as `var(--font-pretendard)` and loaded via CDN in `globals.css`.

## Core rules

### 1. No inline `style` attributes

**Rule:** Never write `style={{ ... }}` on any element. Use Tailwind utility classes or existing CSS classes from `globals.css` instead.

**Why:** The project standardizes on Tailwind for styling. Mixing inline styles creates two sources of truth, prevents hover/focus/responsive variants from working, and makes it impossible to override via classes. The one-time convenience of inline styles always creates friction later.

**How to apply:** When you need a style that isn't covered by a Tailwind utility, reach for one of these in order:
1. **Tailwind utility class** (e.g., `mt-2`, `flex`, `gap-3`). Prefer these for any common case.
2. **Tailwind arbitrary value** for project CSS variables (e.g., `bg-[var(--card)]`, `text-[var(--gold)]`, `rounded-[var(--radius)]`). Use this for colors/radii that come from the project's design tokens.
3. **Existing CSS class in `globals.css`** (e.g., `card`, `info-grid`, `filter-btn`). Many recurring patterns are already named there.
4. **Last resort:** add a new utility class to `globals.css` — but only if the pattern will be reused.

For dynamic/conditional styles, compose classNames with a template string or a small array-`join` helper. Never fall back to inline `style` for conditional values.

**Example — bad:**
```tsx
<div style={{ marginTop: 10, color: "var(--ink)" }}>
```
**Example — good:**
```tsx
<div className="mt-2.5 text-[var(--ink)]">
```

### 2. No direct emoji characters in JSX

**Rule:** Emoji characters (🚀 ✅ 💍 etc.) must never appear directly inside JSX. Render all emojis through the `TwEmoji` component.

**Why:** Twemoji ensures a consistent cross-platform emoji appearance (iOS/Android/Windows all render differently otherwise). Direct emoji characters also cause font-fallback issues on Korean-primary systems.

**How to apply:**
- Import `TwEmoji` from `../components/ui/TwEmoji` (or `./ui/TwEmoji` depending on depth).
- Pass the emoji as the `emoji` prop: `<TwEmoji emoji="💍" size={20} />`.
- The `size` prop is in pixels and defaults to 18. Pick a size that matches the surrounding text height.

**Allowed exceptions (strings are data, not rendering):**
- Data arrays: `const features = [{ icon: "🚀", ... }]` — storing as a string is fine; render by passing the string to a component that uses `TwEmoji` internally.
- Metadata strings like `metadata.title` in `layout.tsx` — these land in `<head>`, not in JSX.
- `<input placeholder="🏛️">` — placeholders are browser-rendered text, not JSX children. Generally avoid, but not forbidden.
- Plain Unicode symbols that aren't in Unicode's emoji list (e.g., `✕` U+2715, `★` U+2605) — these are dingbats, not emojis, and render as text glyphs.

**Example — bad:**
```tsx
<h1>💍 웨딩홀 비교 리스트</h1>
```
**Example — good:**
```tsx
import TwEmoji from "./ui/TwEmoji";
<h1><TwEmoji emoji="💍" size={20} /> 웨딩홀 비교 리스트</h1>
```

### 3. TypeScript: no `any`, props as interface

**Rule:** Never use `any` (including `as any`). Every component's props must be declared as an `interface` at the top of the file, not inline.

**Why:** `any` defeats the whole reason for using TypeScript. Inline prop types make refactors harder and clutter function signatures.

**How to apply:**
```tsx
// Good
interface Props {
  address: string;
  onCopy?: () => void;
}

export default function CopyButton({ address, onCopy }: Props) { /* ... */ }
```

If a component has no props, omit the interface entirely — don't write `interface Props {}`.

For `unknown` data (e.g., JSON from a fetch), use `unknown` and narrow with type guards, not `any`.

### 4. Server Component first, client only when necessary

**Rule:** Do not add `"use client"` to a component unless it actually needs hooks (`useState`, `useEffect`, `useRef`, `useContext`, `useRouter`, etc.), browser-only APIs, or event handlers on DOM elements.

**Why:** Server Components are faster, ship less JavaScript, and let you fetch data directly. Marking something client unnecessarily bloats the bundle.

**How to apply:**
- Start without `"use client"`. Add it only when the compiler or runtime tells you something needs to be client.
- A component that only takes props and renders JSX (even if it imports client children) can stay server. `RouteTab` is an example — it renders `CopyButton` (which is client) without itself being client.
- If only a small portion of a page needs interactivity, split it: keep the page as a Server Component and extract the interactive bit into its own `"use client"` component.

### 5. Default export for components

**Rule:** Every component file has exactly one default export, which is the component itself. Helper functions and types stay as named exports or private to the file.

### 6. Pretendard font

The global `body` font is Pretendard, referenced as `var(--font-pretendard)`. Do not import other fonts, and do not override `font-family` on individual elements unless there's a specific reason. Headings can use `font-semibold`/`font-bold` Tailwind utilities for weight — no need to change family.

## Common components

All reusable UI primitives live under `src/app/components/ui/`. Before building inline UI, check this directory for an existing component.

**Current inventory:**
- `TwEmoji` — renders an emoji as a Twemoji SVG `<img>`. Props: `emoji`, `size?`, `className?`, `alt?`.

**When to extract a new common component:** Only extract to `components/ui/` when all three conditions are true:
1. The same UI pattern is repeated in **3 or more files**.
2. Props alone are enough to configure all variants (no per-call overrides via composition).
3. The component is purely visual — no business logic, no data fetching, no project-specific terminology.

When you do extract one, update `CLAUDE.md`'s component inventory so the next person can find it.

## Styling patterns in this project

The project mixes Tailwind utilities with hand-written CSS classes in `globals.css`. The existing CSS classes encode the visual identity (cards, price badges, info grids, timeline markers, modal chrome) — prefer those over reconstructing the same look in Tailwind.

**Use existing CSS class when:** the element matches a named pattern already in `globals.css`. Examples: `card`, `card-body`, `filter-btn`, `badge`, `info-grid`, `info-cell`, `note`, `modal-content`, `form-grid`, `fab`, `tl-card`, `tl-dot`, `copy-btn`.

**Use Tailwind when:** you need one-off spacing/layout (e.g., `mt-4`, `flex`, `gap-2`), a color that ties to the design tokens (`text-[var(--gold)]`), or a responsive/state variant.

**Use Tailwind arbitrary values for the design tokens:**
```
bg-[var(--bg)]    bg-[var(--card)]    bg-[var(--gold-light)]
text-[var(--ink)] text-[var(--ink2)]  text-[var(--gold)]
border-[var(--border)]                rounded-[var(--radius)]
```

## Workflow checklist

Before considering a frontend change done, walk through this list:

1. **Read `CLAUDE.md`** if you haven't already this session.
2. **Read the file you're editing** fully before modifying — do not guess at structure.
3. **Check `components/ui/`** for an existing component you can reuse.
4. **No `style={{}}`** anywhere in your diff.
5. **No direct emojis** in JSX — all via `TwEmoji`.
6. **Props are an `interface`** at the top of the file.
7. **No `any`**, including `as any` casts.
8. **`"use client"`** only where genuinely needed.
9. **Verify visual patterns** against existing CSS classes before writing new ones.
10. **Only change what was asked** — don't drive-by refactor unrelated code in the same edit.

If the user's request conflicts with one of these rules, ask before compromising. The rules exist to keep the codebase coherent; small exceptions compound into inconsistency fast.
