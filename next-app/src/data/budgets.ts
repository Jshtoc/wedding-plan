// Shared budget types + fixed category metadata.
// Used by: BudgetSection (edit UI), BudgetDonutChart (dashboard),
// db.ts (Supabase mapping), /api/budgets route.

export type BudgetCategory = "hall" | "studio" | "dress" | "makeup" | "etc";

export interface BudgetItem {
  category: BudgetCategory;
  budget: number; // 만원 단위
}

export interface BudgetCategoryMeta {
  id: BudgetCategory;
  label: string;
  icon: string; // emoji (data-layer — render with TwEmoji)
  color: string; // hex — used by chart + accent UI
  description: string;
}

/**
 * The fixed category list. Adding a new category requires updating:
 *   1) This array
 *   2) The CHECK constraint in supabase/budgets.sql
 *   3) The BudgetCategory union above
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
  {
    id: "etc",
    label: "기타",
    icon: "📌",
    color: "#14b8a6",
    description: "예물·예단·신혼여행 등",
  },
];

/** Merge a possibly-partial budgets list with defaults so the UI
 *  always renders all 5 categories even when the DB is empty. */
export function withDefaults(items: BudgetItem[]): BudgetItem[] {
  const map = new Map(items.map((i) => [i.category, i.budget]));
  return BUDGET_CATEGORIES.map((c) => ({
    category: c.id,
    budget: map.get(c.id) ?? 0,
  }));
}

export function totalBudget(items: BudgetItem[]): number {
  return items.reduce((sum, i) => sum + (i.budget || 0), 0);
}
