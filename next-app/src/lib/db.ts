import { supabase } from "./supabase";
import { WeddingHall, TransportMode } from "@/data/halls";
import { BudgetItem } from "@/data/budgets";
import { WeddingEvent, EventType } from "@/data/events";
import {
  DressTarget,
  Vendor,
  VendorCategory,
  VENDOR_CATEGORIES,
} from "@/data/vendors";

// DB row (snake_case) → 프론트엔드 (camelCase)
function rowToHall(row: Record<string, unknown>): WeddingHall {
  return {
    id: row.id as number,
    name: row.name as string,
    sub: (row.sub as string) || "",
    price: (row.price as number) || 0,
    guests: (row.guests as number) || 0,
    parking: (row.parking as number) || 0,
    transport: (row.transport as TransportMode[] | null) || [],
    note: (row.note as string) || "",
  };
}

// 프론트엔드 (camelCase) → DB row (snake_case)
function hallToRow(hall: Omit<WeddingHall, "id">) {
  return {
    name: hall.name,
    sub: hall.sub,
    price: hall.price,
    guests: hall.guests,
    parking: hall.parking,
    transport: hall.transport,
    note: hall.note,
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

/* ─────────────── Budgets ─────────────── */

function rowToBudget(row: Record<string, unknown>): BudgetItem {
  return {
    category: row.category as string,
    budget: (row.budget as number) || 0,
    label: (row.label as string | null) ?? undefined,
    icon: (row.icon as string | null) ?? undefined,
  };
}

export async function getBudgets(): Promise<BudgetItem[]> {
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw error;
  return (data || []).map(rowToBudget);
}

/**
 * Upsert the provided rows AND delete any custom rows (category
 * starting with "custom:") that are not in the payload. This lets the
 * client fully manage its custom list — removed items disappear from
 * the DB on save. Fixed categories (hall/studio/dress/makeup/etc) and
 * `total` are never touched by the delete step.
 */
export async function upsertBudgets(items: BudgetItem[]): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((i) => ({
    category: i.category,
    budget: Math.max(0, Math.floor(i.budget) || 0),
    label: i.label ?? null,
    icon: i.icon ?? null,
    updated_at: new Date().toISOString(),
  }));
  const { error: upsertError } = await supabase
    .from("budgets")
    .upsert(rows, { onConflict: "category" });
  if (upsertError) throw upsertError;

  // Reconcile deletes: any custom:* row in the DB that is NOT in the
  // payload should be removed. Fixed rows are left alone.
  const keptCustomKeys = items
    .map((i) => i.category)
    .filter((c) => c.startsWith("custom:"));
  const { data: existing, error: readError } = await supabase
    .from("budgets")
    .select("category")
    .like("category", "custom:%");
  if (readError) throw readError;
  const toDelete = (existing || [])
    .map((r) => r.category as string)
    .filter((c) => !keptCustomKeys.includes(c));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from("budgets")
      .delete()
      .in("category", toDelete);
    if (delError) throw delError;
  }
}

/* ─────────────── Events ─────────────── */

function rowToEvent(row: Record<string, unknown>): WeddingEvent {
  return {
    id: row.id as number,
    date: row.date as string,
    title: row.title as string,
    type: (row.type as EventType) || "other",
    time: (row.time as string | null) ?? undefined,
    location: (row.location as string | null) ?? undefined,
    memo: (row.memo as string | null) ?? undefined,
  };
}

function eventToRow(e: Omit<WeddingEvent, "id">) {
  return {
    date: e.date,
    title: e.title,
    type: e.type,
    time: e.time ?? null,
    location: e.location ?? null,
    memo: e.memo ?? null,
  };
}

export async function getEvents(): Promise<WeddingEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToEvent);
}

export async function createEvent(
  e: Omit<WeddingEvent, "id">
): Promise<WeddingEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert(eventToRow(e))
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function updateEvent(
  id: number,
  e: Omit<WeddingEvent, "id">
): Promise<WeddingEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(eventToRow(e))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function deleteEvent(id: number): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

/* ─────────────── Vendors (studio / dress / makeup) ─────────────── */

function vendorTable(category: VendorCategory): string {
  return VENDOR_CATEGORIES[category].table;
}

function rowToVendor(row: Record<string, unknown>): Vendor {
  const v: Vendor = {
    id: row.id as number,
    name: row.name as string,
    sub: (row.sub as string) || "",
    price: (row.price as number) || 0,
    note: (row.note as string) || "",
  };
  if (row.target !== undefined && row.target !== null) {
    v.target = row.target as DressTarget;
  }
  return v;
}

function vendorToRow(
  v: Omit<Vendor, "id">,
  category: VendorCategory
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: v.name,
    sub: v.sub,
    price: v.price,
    note: v.note,
  };
  if (category === "dress") {
    base.target = v.target ?? "bride";
  }
  return base;
}

export async function getVendors(category: VendorCategory): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .select("*")
    .order("price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToVendor);
}

export async function createVendor(
  category: VendorCategory,
  v: Omit<Vendor, "id">
): Promise<Vendor> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .insert(vendorToRow(v, category))
    .select()
    .single();
  if (error) throw error;
  return rowToVendor(data);
}

export async function updateVendor(
  category: VendorCategory,
  id: number,
  v: Omit<Vendor, "id">
): Promise<Vendor> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .update(vendorToRow(v, category))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToVendor(data);
}

export async function deleteVendor(
  category: VendorCategory,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from(vendorTable(category))
    .delete()
    .eq("id", id);
  if (error) throw error;
}
