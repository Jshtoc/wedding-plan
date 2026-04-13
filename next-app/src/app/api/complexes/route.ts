import { NextRequest, NextResponse } from "next/server";
import { getComplexes, createComplex } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const complexes = await getComplexes(groupId);
    return NextResponse.json(complexes);
  } catch (e: unknown) {
    console.error("GET /api/complexes error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    const complex = await createComplex(groupId, body);
    return NextResponse.json(complex, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
