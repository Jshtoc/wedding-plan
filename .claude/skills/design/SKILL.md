---
name: design
description: Visual design system and aesthetic consistency rules for the wedding-plan project. Use this skill whenever the user asks you to design, style, or visually tune any part of the UI — picking colors, spacing, typography, shadows, border radius, button/input/card appearance, hover/focus/active states, transitions, emoji/icon sizing, or any subjective "make it look better" request. Trigger even when the request is vague like "더 이쁘게", "예쁘게 해줘", "세련되게 해줘", "디자인 수정", "이 화면 디자인", "색 바꿔줘", "간격 조정", or when a specific visual element (button, card, input, modal, header, etc.) is being restyled. This skill complements the frontend skill — frontend handles code correctness (no inline style, no `any`, interface props), design handles what the UI should actually look like. When both apply, consult both.
---

# Design Skill

This skill encodes the visual design system for the wedding-plan project. It exists because small, seemingly local design decisions (spacing, color picks, radius values) accumulate into inconsistency if each change is made ad hoc. By pointing to this skill before any visual work, we keep the UI coherent — same spacing rhythm, same type scale, same component patterns across pages.

Before starting, also read `CLAUDE.md` at the project root and the companion `frontend` skill — they handle the "how to code it" side, while this skill handles the "how it should look" side.

For the exact token values, full typography scale, detailed component pattern catalog, and concrete do/don't examples, read `convention.md` in this same skill directory. Refer to it any time you're about to pick a color, spacing value, border radius, or reproduce a UI pattern.

## Core principle

**Reuse before invent.** The codebase already has a palette, a spacing rhythm, a radius scale, and patterns for every common element (card, button, input, badge, modal, form group). Before reaching for a new arbitrary value, check whether the thing you want already exists as:
1. A CSS class in `src/app/globals.css` (for main-app visual patterns like `.card`, `.filter-btn`, `.info-grid`, `.tl-card`)
2. A design token in the `@theme` block of `globals.css` (colors, radii, font)
3. A Tailwind utility with a sensible default value

Only invent when none of the above fits — and when you do, make it a token (see "Adding a token" below).

## Two palettes

This project uses **two distinct color palettes** and they must not be mixed within the same page.

### Main palette (warm, wedding theme)
Used for: the main app (`/`, halls list, route timeline, modals, forms after login).

| Token | Hex | Role |
|---|---|---|
| `bg-bg` | `#f7f4f0` | page background (warm cream) |
| `bg-card` | `#ffffff` | card surface |
| `text-ink` | `#1a1714` | primary text |
| `text-ink2` | `#6b6560` | secondary text |
| `text-ink3` | `#a39e99` | muted text, placeholders |
| `bg-gold` / `text-gold` | `#b8935a` | brand accent |
| `bg-gold-light` | `#f5ede0` | soft gold surface |
| `text-green` | `#3a7d5e` | success / good-price |
| `text-amber` | `#b8721a` | warning / mid-price |
| `text-red` | `#c0392b` | error / over-budget |
| `border-border` | `#e8e2da` | default border |

### Auth palette (light, login page only)
Used for: the `/login` page. A minimal, clean, light theme that's distinct from the warm main app while still feeling calm and modern.

| Token | Hex | Role |
|---|---|---|
| `bg-sapphire` | `#4f46e5` | indigo — primary CTA button |
| `text-jade` | `#0d9488` | teal — form labels, accents |
| `border-pearl` | `#e5e7eb` | light gray — input borders, dividers |

The surrounding neutrals use Tailwind's default `gray-*` scale (`text-gray-900` for body, `text-gray-500` for captions, `text-gray-400` for placeholders, `bg-[#f5f5f7]` for the page background).

**When to use which**:
- Login page → auth palette only (sapphire / jade / pearl + gray neutrals)
- Every other page (home, modals, forms, card grids) → main palette only (gold / ink / warm neutrals)
- Don't mix. If you need a primary action color on a main-palette page, use `bg-ink` or `bg-gold` — not `bg-sapphire`.

## Design tokens (Tailwind v4 custom)

All colors, fonts, and the card radius are defined as `@theme` tokens in `src/app/globals.css`. Tailwind v4 auto-generates utilities from them, so you write `bg-gold` instead of `bg-[var(--gold)]` and `bg-sapphire` instead of `bg-[#4f46e5]`.

**Use the token utilities first.** Fall back to arbitrary `bg-[var(--...)]` only for the legacy `:root` variables that still exist for the globals.css CSS classes (e.g. `border-[var(--border)]` works too but `border-border` is preferred in new code).

## Spacing rhythm

Stick to a small set of Tailwind spacing values. Don't introduce random pixel values.

- **Intra-component** (label → input, icon → text): `gap-2`, `mb-2`, `mb-2.5`
- **Between siblings in a group** (two form fields in a row, two badges): `gap-3`, `gap-4`
- **Between form field groups**: `mb-5` / `mb-6`
- **Between sections inside a card**: `mb-8`
- **Card internal padding**: `p-4` (compact list item) / `p-6` (standard card) / `p-8 sm:p-10` (spacious auth card)
- **Section vertical rhythm**: `py-10` / `py-12` (login outer) / default flow for main app (globals.css handles)

Prefer consistent vertical rhythm over exact visual centering. If one card uses `mb-6` between fields, the next should too.

## Typography

Pretendard is the only font. Weights available: 400 (normal), 500 (medium), 600 (semibold), 700 (bold — rare).

- **Hero heading**: `text-2xl` / `text-3xl` + `font-semibold` or `font-bold`
- **Page title**: `text-xl` + `font-semibold`
- **Card title**: `text-base` / `text-lg` + `font-semibold`
- **Body text**: `text-sm` (14px) — default for most content
- **Labels**: `text-[11px]` / `text-xs` + `font-medium`
- **Hints / captions**: `text-[11px]` / `text-xs`
- **Eyebrow tags (WEDDING PLAN)**: `text-[10px]` + `font-semibold` + `tracking-[0.25em]` + `uppercase`
- **Input fields**: `text-base` (16px) — **non-negotiable on inputs** to prevent iOS Safari zoom-in

## Touch targets

Any interactive element that a mobile user needs to tap (button, input, icon button, link) should have a hit area of at least 44px (`h-11` minimum, `h-12` recommended). Use visual padding to reach the target size even if the visual element is smaller.

## Radius scale

- Tags / badges: `rounded-full` or `rounded-[20px]`
- Buttons / inputs: `rounded-xl` (12px)
- Small cards / info cells: `rounded-lg` (8px) or `rounded-[10px]`
- Standard cards: `rounded-[var(--radius)]` (16px) — the project's main card radius
- Hero / modal / spacious surfaces: `rounded-3xl` (24px) or `rounded-[28px]`

Don't use more than 3 distinct radius values on a single page — it reads as noisy.

## Shadow hierarchy

Four defined levels, ordered by depth. Pick the one that matches the element's role.

1. **No shadow** (flush surface): info cells, inline badges
2. **Subtle** `shadow-[0_4px_20px_rgba(0,0,0,0.04)]`: resting cards on the warm bg
3. **Prominent** `shadow-[0_12px_40px_-12px_rgba(26,23,20,0.15)]`: floating cards, callouts
4. **Modal / overlay** `shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]` or `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]` for the auth card

For primary CTA buttons, pair a soft brand-colored shadow to lift them off the surface — e.g. the sapphire auth button uses `shadow-[0_4px_16px_-4px_rgba(79,70,229,0.35)]`.

## Interaction states

Every interactive element needs all four states:

- **Rest**: the default look
- **Hover**: subtle brightness/opacity change (skip on touch devices — they don't hover)
- **Focus**: clear border color change to the accent (`focus:border-gold` for main palette, `focus:border-sapphire focus:ring-4 focus:ring-sapphire/10` for auth palette), plus `focus:outline-none`
- **Active**: `active:scale-[0.98]` for buttons, slight feedback
- **Disabled** (when applicable): `disabled:opacity-60 disabled:cursor-not-allowed`

Always transition color/background changes with `transition-colors`. Reserve `transition-all` for cases where you really need multiple properties animated, since it's heavier.

## Motion

Keep it restrained. The app is a tool, not an experience.

- **Color/background transitions**: `transition-colors` (150ms default)
- **Press feedback**: `active:scale-[0.98]`
- **Loading spinners**: `animate-spin` on a border circle
- **No complex page transitions**, no staggered entrance animations, no parallax

## Emojis (TwEmoji sizing)

All emojis go through the `TwEmoji` component (see frontend skill). The `size` prop is in pixels. Pick a size that matches the surrounding text.

- Inline with `text-xs` (12px): `size={12}` or `size={14}`
- Inline with `text-sm` (14px): `size={14}` or `size={16}`
- Inline with `text-base` (16px): `size={16}` or `size={18}`
- Inline with `text-lg` / `text-xl`: `size={20}` or `size={24}`
- Button label icon: `size={14}` (next to button text)
- Standalone decoration in a circle frame: `size={32}` ~ `size={80}`

## Component pattern catalog (quick reference)

See `convention.md` for the full code snippets. Short version:

- **Primary button (warm bg)**: `bg-ink text-white rounded-xl h-12 font-medium` + interaction states
- **Primary button (auth bg)**: `bg-sapphire text-white rounded-2xl h-14 font-semibold` + soft sapphire shadow + interaction states
- **Ghost button on warm dark header**: `bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 text-[11px]`
- **Input (warm)**: `h-12 px-4 text-base bg-bg border border-border rounded-xl` + focus states
- **Input (auth)**: `h-14 px-5 text-base bg-white border border-pearl rounded-2xl` + `focus:border-sapphire focus:ring-4 focus:ring-sapphire/10`
- **Card (warm)**: use the `.card` class from globals.css, or `bg-card border border-border rounded-[var(--radius)] p-6`
- **Card (auth)**: `bg-white border border-pearl/70 rounded-3xl p-8 sm:p-10 shadow-[0_2px_24px_rgba(15,23,42,0.04)]`
- **Error box (warm)**: `bg-red-light text-red border border-red/20 px-3.5 py-3 rounded-xl text-[13px]`
- **Error box (auth)**: `bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-[13px]`

## Adding a token

Only add a new `--color-*` token to `@theme` when **all three** are true:

1. The color appears in 3+ places or is load-bearing for a palette
2. It has a clear semantic name (not `--color-my-purple`)
3. It fits the existing palette (don't add a random neon green to the warm palette)

Document why in a one-line comment next to the token.

If you just need a one-off color, use a Tailwind arbitrary value or pull the nearest existing token at lower opacity. Don't pollute `@theme` with one-shot colors.

## Workflow checklist

Before calling a visual task done, walk through this list:

1. **Read this skill and `convention.md`** if you haven't this session.
2. **Pick palette** — main or auth. Don't mix.
3. **Use tokens**, not raw hex. `bg-sapphire`, not `bg-[#4f46e5]`.
4. **Use spacing from the scale**, not random pixel values.
5. **Interactive elements** have hover / focus / active / disabled states.
6. **Touch targets** ≥ 44px on mobile.
7. **Input font size** ≥ 16px (`text-base`) to prevent iOS zoom.
8. **Emojis via `TwEmoji`**, sized to match their text context.
9. **Respect existing CSS classes** in `globals.css` — don't reimplement `.card`, `.badge`, `.info-grid`, etc.
10. **Consistent radius / shadow** with neighbors on the page.
11. **Don't add tokens** for one-off colors — use arbitrary values or existing tokens.
12. **Change only what was asked** — don't drive-by restyle adjacent components.

If the user's request would force breaking one of these (e.g. "add a random bright pink button"), ask before compromising. The rules exist to keep the project coherent; one-off exceptions compound quickly.
