// Shared budget types + fixed category metadata.
// Used by: BudgetSection (edit UI), BudgetDonutChart (dashboard),
// db.ts (Supabase mapping), /api/budgets route.
//
// The model supports two kinds of rows:
//
//   1. Fixed categories — 5 known wedding slots (hall/studio/dress/
//      makeup/etc) + a `total` pseudo-category for the overall target.
//      These use hardcoded metadata from BUDGET_CATEGORIES.
//
//   2. Custom categories — user-added rows with an arbitrary `label`.
//      The `category` field stores a stable id like "custom:<rand>"
//      and the `label` column holds the display name. Colors are
//      pulled from CUSTOM_PALETTE by position.
//
// `category` is deliberately typed as `string` rather than a union so
// custom values type-check. Use isFixedCategory / isTotalCategory for
// runtime discrimination.

/** The built-in category slugs. Custom items use "custom:*". */
export const FIXED_CATEGORY_IDS = [
  "hall",
  "studio",
  "dress",
  "makeup",
] as const;
export type FixedBudgetCategory = (typeof FIXED_CATEGORY_IDS)[number];
/** Backwards compatibility — some callers still refer to this type. */
export type BudgetCategory = FixedBudgetCategory | "total" | string;

export interface BudgetItem {
  category: string; // fixed id, "total", or "custom:<rand>"
  budget: number; // 만원 단위
  /** Display name — only meaningful for custom categories. */
  label?: string;
  /** User-picked emoji — only meaningful for custom categories.
   *  Fixed categories always use their hardcoded icon. */
  icon?: string;
}

export interface BudgetCategoryMeta {
  id: FixedBudgetCategory;
  label: string;
  icon: string; // emoji (data-layer — render with TwEmoji)
  color: string; // hex — used by chart + accent UI
  description: string;
}

/**
 * The fixed category list. These always render (even when the DB
 * has no row for them) and cannot be deleted. Adding a new fixed
 * slot requires updating this array AND the FIXED_CATEGORY_IDS tuple.
 */
export const BUDGET_CATEGORIES: BudgetCategoryMeta[] = [
  {
    id: "hall",
    label: "웨딩홀",
    icon: "💒",
    color: "#00FFE1",
    description: "예식장 대관료 + 식대",
  },
  {
    id: "studio",
    label: "스튜디오",
    icon: "📸",
    color: "#10b981",
    description: "프리웨딩 촬영 + 본식 스냅",
  },
  {
    id: "dress",
    label: "드레스",
    icon: "👰",
    color: "#34d399",
    description: "신부 드레스 + 신랑 턱시도",
  },
  {
    id: "makeup",
    label: "메이크업",
    icon: "💄",
    color: "#6ee7b7",
    description: "신부 + 혼주 메이크업",
  },
];

/**
 * Curated emoji palette for the custom-row icon picker. Focused on
 * wedding-planning contexts (venues, gifts, lodging, food, honeymoon).
 * Extend as needed — positional changes are safe since each row stores
 * its own `icon` string.
 */
export const BUDGET_ICONS = [
  "📌",
  "💍",
  "💐",
  "🌹",
  "🎁",
  "🎀",
  "🎉",
  "🎊",
  "🍾",
  "🥂",
  "🍰",
  "🍽️",
  "🏨",
  "🏠",
  "🛫",
  "🏖️",
  "🚗",
  "💼",
  "💰",
  "💳",
  "📷",
  "🎵",
  "✨",
  "⭐",
];

/** Palette assigned to custom items in the order they appear. */
export const CUSTOM_PALETTE = [
  "#f472b6", // pink-400
  "#a78bfa", // violet-400
  "#60a5fa", // blue-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#22d3ee", // cyan-400
  "#a3e635", // lime-400
  "#c084fc", // purple-400
];

export function isFixedCategory(id: string): id is FixedBudgetCategory {
  return (FIXED_CATEGORY_IDS as readonly string[]).includes(id);
}

export function isTotalCategory(id: string): boolean {
  return id === "total";
}

export function isCustomCategory(id: string): boolean {
  return id.startsWith("custom:");
}

/** Generate a stable id for a new custom category row. */
export function makeCustomId(): string {
  return `custom:${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/**
 * Merge a possibly-partial budgets list with defaults.
 *   - Fixed 5 categories always present (filled in with 0 if missing).
 *   - Custom items preserved in their original order.
 *   - The `total` pseudo-category is handled separately via
 *     totalBudgetTarget(); it is stripped from the returned list.
 */
export function withDefaults(items: BudgetItem[]): BudgetItem[] {
  const map = new Map(items.map((i) => [i.category, i]));
  const fixed: BudgetItem[] = BUDGET_CATEGORIES.map((c) => ({
    category: c.id,
    budget: map.get(c.id)?.budget ?? 0,
  }));
  const customs: BudgetItem[] = items
    .filter((i) => isCustomCategory(i.category))
    .map((i) => ({
      category: i.category,
      budget: i.budget || 0,
      label: i.label || "",
      icon: i.icon || "📌",
    }));
  return [...fixed, ...customs];
}

/** Sum of all real budgets (fixed + custom), excluding `total`. */
export function totalBudget(items: BudgetItem[]): number {
  return items.reduce(
    (sum, i) => (isTotalCategory(i.category) ? sum : sum + (i.budget || 0)),
    0
  );
}

/** Read the user-entered overall target from a raw items array. */
export function totalBudgetTarget(items: BudgetItem[]): number {
  return items.find((i) => isTotalCategory(i.category))?.budget ?? 0;
}

/**
 * Display metadata for any row — fixed or custom. Returns a uniform
 * shape the UI can render without branching. Custom items use a
 * default icon and a color from CUSTOM_PALETTE indexed by position.
 */
export function getItemMeta(
  item: BudgetItem,
  customIndex: number
): { label: string; icon: string; color: string; description: string } {
  if (isFixedCategory(item.category)) {
    const meta = BUDGET_CATEGORIES.find((c) => c.id === item.category)!;
    return {
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      description: meta.description,
    };
  }
  return {
    label: item.label || "항목",
    icon: item.icon || "📌",
    color: CUSTOM_PALETTE[customIndex % CUSTOM_PALETTE.length],
    description: "사용자 추가 항목",
  };
}
