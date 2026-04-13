import { NextRequest, NextResponse } from "next/server";
import { updateComplex, deleteComplex } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const groupId = getGroupId(req.headers);
    const { id } = await params;
    const body = await req.json();
    const complex = await updateComplex(groupId, Number(id), body);
    return NextResponse.json(complex);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const groupId = getGroupId(req.headers);
    const { id } = await params;
    await deleteComplex(groupId, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
