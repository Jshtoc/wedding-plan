import { NextRequest, NextResponse } from "next/server";
import { getChecklist, upsertChecklist } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const data = await getChecklist(groupId);
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("GET /api/checklist error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    await upsertChecklist(groupId, {
      checked:     Array.isArray(body.checked)           ? body.checked     : [],
      details:     body.details && typeof body.details === "object" ? body.details : {},
      totalBudget: typeof body.totalBudget === "string"  ? body.totalBudget : "",
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("PUT /api/checklist error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
