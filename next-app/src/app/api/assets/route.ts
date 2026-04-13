import { NextRequest, NextResponse } from "next/server";
import { getAssets, upsertAsset } from "@/lib/db";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const assets = await getAssets(groupId);
    return NextResponse.json(assets);
  } catch (e: unknown) {
    console.error("GET /api/assets error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const body = await req.json();
    const asset = await upsertAsset(groupId, body);
    return NextResponse.json(asset);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
