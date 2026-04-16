import { NextRequest, NextResponse } from "next/server";
import { getRoutes, createRoute } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const routes = await getRoutes(groupId);
    return NextResponse.json(routes);
  } catch (e: unknown) {
    console.error("GET /api/routes error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    if (!body?.payload) {
      return NextResponse.json(
        { error: "payload가 필요합니다." },
        { status: 400 }
      );
    }
    const created = await createRoute(groupId, {
      name: body.name || "",
      visitedAt: body.visitedAt || null,
      payload: body.payload,
      note: body.note || "",
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/routes error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
