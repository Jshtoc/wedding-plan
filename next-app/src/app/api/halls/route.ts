import { NextRequest, NextResponse } from "next/server";
import { getHalls, createHall } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const halls = await getHalls(groupId);
    return NextResponse.json(halls);
  } catch (e: unknown) {
    console.error("GET /api/halls error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    const hall = await createHall(groupId, body);
    return NextResponse.json(hall, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
