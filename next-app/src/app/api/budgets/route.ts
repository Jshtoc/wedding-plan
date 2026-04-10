import { NextRequest, NextResponse } from "next/server";
import { getBudgets, upsertBudgets } from "@/lib/db";
import {
  BudgetItem,
  isFixedCategory,
  isTotalCategory,
  isCustomCategory,
} from "@/data/budgets";

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
 * Body: { items: Array<{ category, budget, label? }> }
 *
 * Validates each row: category must be either one of the fixed five,
 * `total`, or a `custom:*` string. Custom rows without a trimmed
 * label are silently dropped — the client may send placeholder rows
 * the user never named, and we don't want to persist empty labels.
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
      const r = raw as {
        category?: unknown;
        budget?: unknown;
        label?: unknown;
        icon?: unknown;
      };

      if (typeof r.category !== "string" || r.category.length === 0) {
        return NextResponse.json(
          { error: `유효하지 않은 category: ${String(r.category)}` },
          { status: 400 }
        );
      }

      const isValid =
        isFixedCategory(r.category) ||
        isTotalCategory(r.category) ||
        isCustomCategory(r.category);
      if (!isValid) {
        return NextResponse.json(
          { error: `알 수 없는 category 형식: ${r.category}` },
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

      const label =
        typeof r.label === "string" ? r.label.trim() : undefined;
      // Icons are short emoji strings — cap length to keep DB rows
      // sane. Empty string is treated as "not set".
      const icon =
        typeof r.icon === "string" && r.icon.length > 0 && r.icon.length <= 16
          ? r.icon
          : undefined;

      // Drop empty-labelled custom rows — these are usually rows the
      // user added but never named, we don't want to persist them.
      if (isCustomCategory(r.category) && !label) continue;

      items.push({
        category: r.category,
        budget: Math.floor(budget),
        ...(label ? { label } : {}),
        ...(icon ? { icon } : {}),
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
