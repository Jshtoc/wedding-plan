import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, updateEvent } from "@/lib/db";
import { EVENT_TYPES, EventType, WeddingEvent } from "@/data/events";

type Validated = Omit<WeddingEvent, "id">;
type ValidationResult = Validated | { error: string };

function parseId(idStr: string): number | null {
  const n = Number(idStr);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function validate(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { error: "잘못된 요청" };
  const b = body as {
    date?: unknown;
    title?: unknown;
    type?: unknown;
    time?: unknown;
    location?: unknown;
    memo?: unknown;
  };

  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date))
    return { error: "date는 YYYY-MM-DD 형식이어야 합니다." };
  if (typeof b.title !== "string" || !b.title.trim())
    return { error: "title이 필요합니다." };
  if (
    typeof b.type !== "string" ||
    !EVENT_TYPES.includes(b.type as EventType)
  )
    return { error: `유효하지 않은 type: ${String(b.type)}` };

  const time = typeof b.time === "string" ? b.time.trim() : "";
  const location = typeof b.location === "string" ? b.location.trim() : "";
  const memo = typeof b.memo === "string" ? b.memo.trim() : "";

  return {
    date: b.date,
    title: b.title.trim(),
    type: b.type as EventType,
    ...(time ? { time } : {}),
    ...(location ? { location } : {}),
    ...(memo ? { memo } : {}),
  };
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const numId = parseId(id);
    if (numId === null)
      return NextResponse.json({ error: "잘못된 id" }, { status: 400 });

    const body = await req.json();
    const parsed = validate(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const updated = await updateEvent(numId, parsed);
    return NextResponse.json(updated);
  } catch (e: unknown) {
    console.error("PUT /api/events/[id] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const numId = parseId(id);
    if (numId === null)
      return NextResponse.json({ error: "잘못된 id" }, { status: 400 });
    await deleteEvent(numId);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("DELETE /api/events/[id] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
