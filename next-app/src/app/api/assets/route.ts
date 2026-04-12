import { NextRequest, NextResponse } from "next/server";
import { getAssets, upsertAsset } from "@/lib/db";

export async function GET() {
  try {
    const assets = await getAssets();
    return NextResponse.json(assets);
  } catch (e: unknown) {
    console.error("GET /api/assets error:", e);
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const asset = await upsertAsset(body);
    return NextResponse.json(asset);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
