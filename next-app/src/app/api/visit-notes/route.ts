import { NextRequest, NextResponse } from "next/server";
import { getVisitNotes, createVisitNote } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const notes = await getVisitNotes(groupId);
    return NextResponse.json(notes);
  } catch (e: unknown) {
    console.error("GET /api/visit-notes error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    const note = await createVisitNote(groupId, body);
    return NextResponse.json(note, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
