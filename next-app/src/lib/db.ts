import { supabase } from "./supabase";
import { WeddingHall } from "@/data/halls";

// DB row (snake_case) → 프론트엔드 (camelCase)
function rowToHall(row: Record<string, unknown>): WeddingHall {
  return {
    id: row.id as number,
    name: row.name as string,
    sub: (row.sub as string) || "",
    price: (row.price as number) || 0,
    priceLabel: (row.price_label as string) || "",
    priceText: (row.price_text as string) || "",
    priceLevel: (row.price_level as "ok" | "warn" | "over") || "ok",
    ktx: (row.ktx as number) || 3,
    ktxText: (row.ktx_text as string) || "",
    ktxWarn: (row.ktx_warn as boolean) || undefined,
    parking: (row.parking as number) || 0,
    isBest: (row.is_best as boolean) || undefined,
    bestLabel: (row.best_label as string) || undefined,
    image: (row.image as string) || "",
    imageAlt: (row.image_alt as string) || "",
    imageFallback: (row.image_fallback as string) || "🏛️",
    badges: (row.badges as WeddingHall["badges"]) || [],
    infoGrid: (row.info_grid as WeddingHall["infoGrid"]) || [],
    extraInfoGrid: (row.extra_info_grid as WeddingHall["extraInfoGrid"]) || undefined,
    calc: (row.calc as WeddingHall["calc"]) || { title: "", rows: [] },
    note: (row.note as string) || "",
    noteType: (row.note_type as WeddingHall["noteType"]) || undefined,
  };
}

// 프론트엔드 (camelCase) → DB row (snake_case)
function hallToRow(hall: Omit<WeddingHall, "id">) {
  return {
    name: hall.name,
    sub: hall.sub,
    price: hall.price,
    price_label: hall.priceLabel,
    price_text: hall.priceText,
    price_level: hall.priceLevel,
    ktx: hall.ktx,
    ktx_text: hall.ktxText,
    ktx_warn: hall.ktxWarn || false,
    parking: hall.parking,
    is_best: hall.isBest || false,
    best_label: hall.bestLabel || null,
    image: hall.image,
    image_alt: hall.imageAlt,
    image_fallback: hall.imageFallback,
    badges: hall.badges,
    info_grid: hall.infoGrid,
    extra_info_grid: hall.extraInfoGrid || null,
    calc: hall.calc,
    note: hall.note,
    note_type: hall.noteType || null,
  };
}

export async function getHalls(): Promise<WeddingHall[]> {
  const { data, error } = await supabase
    .from("halls")
    .select("*")
    .order("price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToHall);
}

export async function createHall(hall: Omit<WeddingHall, "id">): Promise<WeddingHall> {
  const { data, error } = await supabase
    .from("halls")
    .insert(hallToRow(hall))
    .select()
    .single();
  if (error) throw error;
  return rowToHall(data);
}

export async function updateHall(id: number, hall: Omit<WeddingHall, "id">): Promise<WeddingHall> {
  const { data, error } = await supabase
    .from("halls")
    .update(hallToRow(hall))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToHall(data);
}

export async function deleteHall(id: number): Promise<void> {
  const { error } = await supabase
    .from("halls")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
