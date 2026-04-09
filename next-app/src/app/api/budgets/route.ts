import { NextRequest, NextResponse } from "next/server";
import { getBudgets, upsertBudgets } from "@/lib/db";
import { BudgetCategory, BudgetItem } from "@/data/budgets";

const VALID_CATEGORIES: BudgetCategory[] = [
  "hall",
  "studio",
  "dress",
  "makeup",
  "etc",
];

export async function GET() {
  try {
    const budgets = await getBudgets();
    return NextResponse.json(budgets);
  } catch (e: unknown) {
    console.error("GET /api/budgets error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/budgets
 * Body: { items: Array<{ category, budget }> }
 * Upserts every row in one call. Categories must be in the fixed list.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      items?: unknown;
    };
    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "items 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const items: BudgetItem[] = [];
    for (const raw of body.items) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as { category?: unknown; budget?: unknown };
      if (
        typeof r.category !== "string" ||
        !VALID_CATEGORIES.includes(r.category as BudgetCategory)
      ) {
        return NextResponse.json(
          { error: `유효하지 않은 category: ${String(r.category)}` },
          { status: 400 }
        );
      }
      const budget = Number(r.budget);
      if (!Number.isFinite(budget) || budget < 0) {
        return NextResponse.json(
          { error: "budget은 0 이상의 숫자여야 합니다." },
          { status: 400 }
        );
      }
      items.push({
        category: r.category as BudgetCategory,
        budget: Math.floor(budget),
      });
    }

    await upsertBudgets(items);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("PUT /api/budgets error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
