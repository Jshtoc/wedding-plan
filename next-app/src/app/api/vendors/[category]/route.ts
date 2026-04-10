import { NextRequest, NextResponse } from "next/server";
import { createVendor, getVendors } from "@/lib/db";
import {
  isDressTarget,
  isVendorCategory,
  Vendor,
  VendorCategory,
} from "@/data/vendors";

type Validated = Omit<Vendor, "id">;
type ValidationResult = Validated | { error: string };

function validate(body: unknown, category: VendorCategory): ValidationResult {
  if (!body || typeof body !== "object") return { error: "잘못된 요청" };
  const b = body as {
    name?: unknown;
    sub?: unknown;
    price?: unknown;
    note?: unknown;
    target?: unknown;
  };

  if (typeof b.name !== "string" || !b.name.trim())
    return { error: "name이 필요합니다." };
  const price = Number(b.price);
  if (!Number.isFinite(price) || price < 0)
    return { error: "price는 0 이상의 숫자여야 합니다." };

  const result: Validated = {
    name: b.name.trim(),
    sub: typeof b.sub === "string" ? b.sub.trim() : "",
    price: Math.floor(price),
    note: typeof b.note === "string" ? b.note.trim() : "",
  };

  if (category === "dress") {
    if (!isDressTarget(b.target)) {
      return { error: "target은 groom 또는 bride여야 합니다." };
    }
    result.target = b.target;
  }

  return result;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ category: string }> }
) {
  const { category } = await ctx.params;
  if (!isVendorCategory(category)) {
    return NextResponse.json(
      { error: `잘못된 category: ${category}` },
      { status: 400 }
    );
  }
  try {
    const vendors = await getVendors(category);
    return NextResponse.json(vendors);
  } catch (e: unknown) {
    console.error(`GET /api/vendors/${category} error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ category: string }> }
) {
  const { category } = await ctx.params;
  if (!isVendorCategory(category)) {
    return NextResponse.json(
      { error: `잘못된 category: ${category}` },
      { status: 400 }
    );
  }
  try {
    const body = await req.json();
    const parsed = validate(body, category);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const created = await createVendor(category, parsed);
    return NextResponse.json(created);
  } catch (e: unknown) {
    console.error(`POST /api/vendors/${category} error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
