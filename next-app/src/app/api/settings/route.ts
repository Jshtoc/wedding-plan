import { NextRequest, NextResponse } from "next/server";
import { getSettings, upsertSettings } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const settings = await getSettings(groupId);
    return NextResponse.json(settings);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    const menuHidden: string[] = Array.isArray(body.menu_hidden) ? body.menu_hidden : [];
    await upsertSettings(groupId, menuHidden);
    return NextResponse.json({ menu_hidden: menuHidden });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
