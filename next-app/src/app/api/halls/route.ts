import { NextRequest, NextResponse } from "next/server";
import { getHalls, createHall } from "@/lib/db";

export async function GET() {
  try {
    const halls = await getHalls();
    return NextResponse.json(halls);
  } catch (e: unknown) {
    console.error("GET /api/halls error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hall = await createHall(body);
    return NextResponse.json(hall, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
