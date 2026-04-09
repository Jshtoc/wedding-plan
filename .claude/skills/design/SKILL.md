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

### Auth palette (dark aurora, login page only)
Used for: the `/login` page. A **deep-night-sky** dark theme with a dominantly green aurora (mint + emerald + deep emerald blobs) behind a **transparent glass card**. Modeled on real northern-lights photography — green is the main aurora hue, not purple/pink. The whole composition is "card floats inside atmosphere".

| Token | Hex | Role |
|---|---|---|
| `bg-mint` | `#00FFE1` | neon mint-cyan — brightest highlight curtain + primary CTA button (pair with `text-gray-900`) + label text on dark glass |
| `bg-green` | `#10b981` | emerald-500 — main aurora curtain body |
| `bg-dark-green` | `#064e3b` | emerald-900 — deep atmospheric tint, darkest/largest blob |

The surrounding surfaces use semi-transparent whites on the dark base:

| Purpose | Value |
|---|---|
| Page background | `bg-[#020806]` (near-black with a faint green undertone) |
| Glass card background | `bg-white/[0.04]` + `backdrop-blur-2xl` |
| Glass card border | `border-white/10` |
| Input background (rest) | `bg-white/[0.05]` |
| Input background (focus) | `bg-white/[0.08]` |
| Input border (rest) | `border-white/15` |
| Input border (focus) | `border-mint/80` with `focus:ring-4 focus:ring-mint/20` |
| Body text on card | `text-white` |
| Muted text on card | `text-white/50` ~ `text-white/60` |
| Labels on card | `text-mint` (bright accent, also ties visually to the button) |
| Error text | `text-red-300` on `bg-red-500/10` + `border border-red-400/20` |

**Button contrast note — mandatory:** mint (`#00FFE1`) with white text is only ~1.3:1, failing WCAG spectacularly. Always pair `bg-mint` with `text-gray-900` (~18:1) for the primary button. Never put white text on mint.

**Aurora background** is the defining visual of this page — see the "Aurora background" section under Motion below for the full pattern. Required for this palette; without it the dark card looks cold.

**When to use which**:
- Login page (and future auth-adjacent pages: signup, reset, etc.) → auth dark palette
- Every other page (home, modals, forms, card grids) → main warm palette only (gold / ink / warm neutrals)
- Don't mix. If you need a primary action color on a main-palette page, use `bg-ink` or `bg-gold` — not `bg-mint`.

## Design tokens (Tailwind v4 custom)

All colors, fonts, and the card radius are defined as `@theme` tokens in `src/app/globals.css`. Tailwind v4 auto-generates utilities from them, so you write `bg-gold` instead of `bg-[var(--gold)]` and `bg-mint` instead of `bg-[#14b8a6]`.

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

### Comfortable form rhythm (reference spec — the login page "feel")

This is the calibrated set of values that the user confirmed feels right for a centered form card (e.g. login page). Reuse these exact numbers for any similar form-on-card page — they give a spacious, calm, confident feel without feeling empty.

| Element | Value |
|---|---|
| Card max width | `max-w-[440px]` |
| Card padding | `p-10 sm:p-12` (40px mobile → 48px desktop) |
| Card radius | `rounded-3xl` (24px) |
| Brand block → first field | `mb-10` (40px) |
| Label → input | `mb-2.5` (10px) |
| Field group → next field | `mb-7` (28px) |
| Last field → submit button | `mb-8` (32px) |
| Input height × padding | `h-[60px] px-6` (60 tall, 24 horizontal) |
| Input radius | `rounded-2xl` (16px) |
| Button height | `h-[60px]` (matches inputs) |
| Button radius | `rounded-2xl` |
| Error box padding | `px-5 py-4` |
| Error box gap (icon → text) | `gap-2.5` |
| Outer page padding | `px-5 py-12` |

Text inside this rhythm:
- Card title: `text-[19px] font-semibold text-gray-900 tracking-tight`
- Subtitle under title: `text-[13px] text-gray-500`
- Labels: `text-sm font-semibold` (use `text-jade` for auth palette, `text-ink2` for warm)
- Inputs: `text-base` (16px, non-negotiable for iOS zoom prevention)
- Button label: `text-base font-semibold tracking-tight`

If a user ever says "여백이 뭔가 어색해" / "박스가 답답해" / "간격이 애매해" on a form-on-card screen, reset the values to this table first before inventing new numbers.

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

For primary CTA buttons, pair a soft brand-colored shadow to lift them off the surface — e.g. the mint auth button uses `shadow-[0_4px_16px_-4px_rgba(20,184,166,0.4)]`.

## Interaction states

Every interactive element needs all four states:

- **Rest**: the default look
- **Hover**: subtle brightness/opacity change (skip on touch devices — they don't hover)
- **Focus**: clear border color change to the accent (`focus:border-gold` for main palette, `focus:border-mint focus:ring-4 focus:ring-mint/20` for auth palette), plus `focus:outline-none`
- **Active**: `active:scale-[0.98]` for buttons, slight feedback
- **Disabled** (when applicable): `disabled:opacity-60 disabled:cursor-not-allowed`

Always transition color/background changes with `transition-colors`. Reserve `transition-all` for cases where you really need multiple properties animated, since it's heavier.

## Motion

Keep it restrained. The app is a tool, not an experience.

- **Color/background transitions**: `transition-colors` (150ms default)
- **Press feedback**: `active:scale-[0.98]`
- **Loading spinners**: `animate-spin` on a border circle
- **No complex page transitions**, no staggered entrance animations, no parallax

### Aurora background (auth-only)

The defining visual of the login page: **four blurred circles drifting across a deep night sky**, blended with `mix-blend-screen` to create true additive aurora glow. Mint + violet + pink + blue on a near-black base (`#030515`). A transparent glass card floats inside the aurora.

**Critical: the base must be very dark.** `mix-blend-screen` is additive: `color + black = color` (bright), `color + white = white` (vanishes). The deeper the base, the more the aurora "glows". Use `#030515` — near-black with a subtle blue undertone.

Pattern: wrap the page with the `AuroraBackground` component (Aceternity UI pattern). The component lives at `src/app/components/ui/AuroraBackground.tsx` and handles all the gradient/animation/blend-mode machinery.

```tsx
import { AuroraBackground } from "@/app/components/ui/AuroraBackground";

export default function LoginPage() {
  return (
    <AuroraBackground className="dark px-5 py-12" animationSpeed={60}>
      <form className="relative z-10 w-full max-w-[440px] bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-10 sm:p-12 border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]">
        {/* content uses dark-theme text colors — see "Auth palette (dark aurora)" above */}
      </form>
    </AuroraBackground>
  );
}
```

Key component props:
- `className` — additional classes on the outer wrapper. **Always pass `dark`** here so the aurora uses the dark-gradient path.
- `animationSpeed` — seconds for one aurora-pan loop. Default 60s (subtle). Use 10–20 for noticeable.
- `showRadialGradient` — default `true`. Fades the aurora via a radial mask from top-right corner.

How the component works internally:
- Outer wrapper is `relative flex min-h-dvh ... dark:bg-zinc-900`
- Inner decoration div sets CSS custom properties (`--aurora`, `--white-gradient`, `--dark-gradient`, `--color-1..5`) via inline style — **this is the one place inline style is allowed in the project** because Tailwind can't set CSS variables dynamically from props
- A deeper div uses Tailwind arbitrary-property syntax (`[background-image:var(--white-gradient),var(--aurora)]` etc) to stack two `repeating-linear-gradient`s, applies `blur-[10px] invert filter` plus `mix-blend-difference` on its `::after` pseudo-element
- The `::after` carries the `[animation:aurora_var(--animation-speed)_linear_infinite]` which pans `background-position` from `50% 50%` → `350% 50%` over the configured duration
- `dark:` variants swap the light `--white-gradient` for `--dark-gradient` and remove the invert
- `prefers-reduced-motion: reduce` in `globals.css` freezes the animation

Because it's a single component, copying aurora to a new auth-adjacent page (signup, password reset, etc.) is one import + one wrapper.

**The card is transparent glass, not white.** It uses `bg-white/[0.04] backdrop-blur-2xl` so the aurora tints it from behind. A solid white card would "punch a hole" in the atmosphere and break the effect. All text inside the card uses dark-theme colors (`text-white`, `text-mint`, `text-white/50`) — not the light-theme `text-gray-900`/`text-jade` you'd use on a white surface.

Rules for this pattern:
- **Only on auth/login-like pages.** Never on the main app.
- **Always pass `className="dark"`** to `AuroraBackground` so the dark gradient variant applies (without `dark`, the component renders its light-mode version on `bg-zinc-50`).
- **Don't reimplement the aurora.** Use the `AuroraBackground` component. Do not copy its internals into other files — future tweaks (animation, gradient stops, opacity) happen in one place.
- **Never modify the component's arbitrary-property className string** unless you really know what you're doing — the order and combination of `[background-image:...]`, `[background-size:...]`, `after:mix-blend-difference`, `dark:invert-0`, etc. is precisely calibrated.
- **The Aceternity aurora colors (`#10b981`/`#34d399`/`#6ee7b7`/`#2dd4bf`/`#14b8a6`) are hard-coded inside the component** as inline CSS variables. These are emerald/teal Tailwind defaults, close to but not identical to the project's `mint`/`green`/`dark-green` tokens. That's fine — the button and labels still use the project tokens, and the aurora colors only exist inside the aurora.
- **Glass card on top** (unchanged): `bg-white/[0.04] backdrop-blur-2xl border border-white/10` + strong dark drop shadow + `relative z-10` so it sits above the aurora layer.
- **Card content colors** (unchanged): `text-white` for body, `text-mint` for labels, `text-white/50`–`/60` for muted.
- **`prefers-reduced-motion`** handled globally in `globals.css` via attribute-selector match on any `[animation:aurora` class.

### Why inline CSS variables are allowed here

The frontend skill forbids inline `style={{...}}` for layout. The `AuroraBackground` component uses inline style only to set CSS custom properties (`--aurora`, `--color-1`, `--animation-speed`, etc.) that are then consumed inside the Tailwind arbitrary-property classes. This is the intended escape hatch because Tailwind cannot set `--*` variables per-instance from props (e.g. `animationSpeed`). Do NOT apply this exception to regular styling — only to CSS variable injection driven by component props.

If the user wants a light-theme auth page instead, the aurora has to be abandoned entirely — there's no light equivalent that reads the same way. Use a plain `bg-[#f5f5f7]` page with the form card in the default light-theme style and no background effect.

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
- **Primary button (auth bg)**: `bg-mint text-gray-900 rounded-2xl h-[60px] font-semibold` + soft mint shadow + interaction states
- **Ghost button on warm dark header**: `bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 text-[11px]`
- **Input (warm)**: `h-12 px-4 text-base bg-bg border border-border rounded-xl` + focus states
- **Input (auth)**: `h-[60px] px-6 text-base bg-white border border-pearl rounded-2xl` + `focus:border-mint focus:ring-4 focus:ring-mint/20`
- **Card (warm)**: use the `.card` class from globals.css, or `bg-card border border-border rounded-[var(--radius)] p-6`
- **Card (auth)**: `bg-white border border-pearl/70 rounded-3xl p-10 sm:p-12 shadow-[0_2px_24px_rgba(15,23,42,0.04)]`
- **Error box (warm)**: `bg-red-light text-red border border-red/20 px-3.5 py-3 rounded-xl text-[13px]`
- **Error box (auth)**: `bg-red-50 text-red-600 border border-red-200 px-5 py-4 rounded-xl text-[13px]`

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
3. **Use tokens**, not raw hex. `bg-mint`, not `bg-[#14b8a6]`.
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
