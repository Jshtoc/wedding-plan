import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getGroupId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const groupId = getGroupId(req.headers);
    const { data, error } = await supabase
      .from("settings")
      .select("menu_hidden")
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ menu_hidden: data?.menu_hidden ?? [] });
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

    const { error } = await supabase
      .from("settings")
      .upsert(
        { group_id: groupId, menu_hidden: menuHidden, updated_at: new Date().toISOString() },
        { onConflict: "group_id" }
      );

    if (error) throw error;
    return NextResponse.json({ menu_hidden: menuHidden });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
