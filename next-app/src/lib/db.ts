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
import { Complex } from "@/data/complexes";
import { PersonAsset, AssetRole } from "@/data/assets";

// ═══════════════════════════════════════════════════════════════
// Every read/write function takes a `groupId` parameter so data
// is scoped to the calling user's group. The group_id column is
// populated by the multi_tenant.sql migration.
// ═══════════════════════════════════════════════════════════════

/* ─────────────── Halls ─────────────── */

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

export async function getHalls(groupId: string): Promise<WeddingHall[]> {
  const { data, error } = await supabase
    .from("halls")
    .select("*")
    .eq("group_id", groupId)
    .order("price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToHall);
}

export async function createHall(
  groupId: string,
  hall: Omit<WeddingHall, "id">
): Promise<WeddingHall> {
  const { data, error } = await supabase
    .from("halls")
    .insert({ ...hallToRow(hall), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return rowToHall(data);
}

export async function updateHall(
  groupId: string,
  id: number,
  hall: Omit<WeddingHall, "id">
): Promise<WeddingHall> {
  const { data, error } = await supabase
    .from("halls")
    .update(hallToRow(hall))
    .eq("id", id)
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) throw error;
  return rowToHall(data);
}

export async function deleteHall(groupId: string, id: number): Promise<void> {
  const { error } = await supabase
    .from("halls")
    .delete()
    .eq("id", id)
    .eq("group_id", groupId);
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

export async function getBudgets(groupId: string): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("group_id", groupId);
  if (error) throw error;
  return (data || []).map(rowToBudget);
}

export async function upsertBudgets(
  groupId: string,
  items: BudgetItem[]
): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((i) => ({
    category: i.category,
    budget: Math.max(0, Math.floor(i.budget) || 0),
    label: i.label ?? null,
    icon: i.icon ?? null,
    group_id: groupId,
    updated_at: new Date().toISOString(),
  }));
  // Composite unique is (group_id, category)
  const { error: upsertError } = await supabase
    .from("budgets")
    .upsert(rows, { onConflict: "group_id,category" });
  if (upsertError) throw upsertError;

  // Reconcile deletes: custom:* rows in THIS group not in the payload.
  const keptCustomKeys = items
    .map((i) => i.category)
    .filter((c) => c.startsWith("custom:"));
  const { data: existing, error: readError } = await supabase
    .from("budgets")
    .select("category")
    .eq("group_id", groupId)
    .like("category", "custom:%");
  if (readError) throw readError;
  const toDelete = (existing || [])
    .map((r) => r.category as string)
    .filter((c) => !keptCustomKeys.includes(c));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from("budgets")
      .delete()
      .eq("group_id", groupId)
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

export async function getEvents(groupId: string): Promise<WeddingEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("group_id", groupId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToEvent);
}

export async function createEvent(
  groupId: string,
  e: Omit<WeddingEvent, "id">
): Promise<WeddingEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({ ...eventToRow(e), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function updateEvent(
  groupId: string,
  id: number,
  e: Omit<WeddingEvent, "id">
): Promise<WeddingEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(eventToRow(e))
    .eq("id", id)
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function deleteEvent(
  groupId: string,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("group_id", groupId);
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

export async function getVendors(
  groupId: string,
  category: VendorCategory
): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .select("*")
    .eq("group_id", groupId)
    .order("price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToVendor);
}

export async function createVendor(
  groupId: string,
  category: VendorCategory,
  v: Omit<Vendor, "id">
): Promise<Vendor> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .insert({ ...vendorToRow(v, category), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return rowToVendor(data);
}

export async function updateVendor(
  groupId: string,
  category: VendorCategory,
  id: number,
  v: Omit<Vendor, "id">
): Promise<Vendor> {
  const { data, error } = await supabase
    .from(vendorTable(category))
    .update(vendorToRow(v, category))
    .eq("id", id)
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) throw error;
  return rowToVendor(data);
}

export async function deleteVendor(
  groupId: string,
  category: VendorCategory,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from(vendorTable(category))
    .delete()
    .eq("id", id)
    .eq("group_id", groupId);
  if (error) throw error;
}

/* ─────────────── Complexes (housing) ─────────────── */

function rowToComplex(row: Record<string, unknown>): Complex {
  return {
    id: row.id as number,
    name: row.name as string,
    city: (row.city as string) || "",
    district: (row.district as string) || "",
    dong: (row.dong as string) || "",
    yearUnits: (row.year_units as string) || "",
    area: (row.area as string) || "",
    salePrice: (row.sale_price as number) || 0,
    jeonsePrice: (row.jeonse_price as number) || 0,
    peakPrice: (row.peak_price as number) || 0,
    lowPrice: (row.low_price as number) || 0,
    lastTradePrice: (row.last_trade_price as number) || 0,
    commuteTime: (row.commute_time as string) || "",
    subwayLine: (row.subway_line as string) || "",
    workplace1: (row.workplace1 as string) || "",
    workplace2: (row.workplace2 as string) || "",
    schoolScore: (row.school_score as string) || "",
    hazard: (row.hazard as string) || "",
    amenities: (row.amenities as string) || "",
    isNewBuild: (row.is_new_build as string) || "",
    isCandidate: (row.is_candidate as boolean) || false,
    note: (row.note as string) || "",
    lat: (row.lat as number | null) ?? undefined,
    lng: (row.lng as number | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
  };
}

function complexToRow(c: Omit<Complex, "id">) {
  return {
    name: c.name,
    city: c.city,
    district: c.district,
    dong: c.dong,
    year_units: c.yearUnits,
    area: c.area,
    sale_price: c.salePrice,
    jeonse_price: c.jeonsePrice,
    peak_price: c.peakPrice,
    low_price: c.lowPrice,
    last_trade_price: c.lastTradePrice,
    commute_time: c.commuteTime,
    subway_line: c.subwayLine,
    workplace1: c.workplace1,
    workplace2: c.workplace2,
    school_score: c.schoolScore,
    hazard: c.hazard,
    amenities: c.amenities,
    is_new_build: c.isNewBuild,
    is_candidate: c.isCandidate,
    note: c.note,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    address: c.address ?? null,
  };
}

export async function getComplexes(groupId: string): Promise<Complex[]> {
  const { data, error } = await supabase
    .from("complexes")
    .select("*")
    .eq("group_id", groupId)
    .order("sale_price", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToComplex);
}

export async function createComplex(
  groupId: string,
  c: Omit<Complex, "id">
): Promise<Complex> {
  const { data, error } = await supabase
    .from("complexes")
    .insert({ ...complexToRow(c), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return rowToComplex(data);
}

export async function updateComplex(
  groupId: string,
  id: number,
  c: Omit<Complex, "id">
): Promise<Complex> {
  const { data, error } = await supabase
    .from("complexes")
    .update(complexToRow(c))
    .eq("id", id)
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) throw error;
  return rowToComplex(data);
}

export async function deleteComplex(
  groupId: string,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("complexes")
    .delete()
    .eq("id", id)
    .eq("group_id", groupId);
  if (error) throw error;
}

/* ─────────────── Assets (groom / bride) ─────────────── */

function rowToAsset(row: Record<string, unknown>): PersonAsset {
  return {
    id: row.id as number,
    role: row.role as AssetRole,
    cash: (row.cash as number) || 0,
    stocks: (row.stocks as number) || 0,
    savings: (row.savings as number) || 0,
    otherAssets: (row.other_assets as number) || 0,
    otherNote: (row.other_note as string) || "",
    monthlyIncome: (row.monthly_income as number) || 0,
    annualIncome: (row.annual_income as number) || 0,
    age: (row.age as number) || 0,
    isHomeless: row.is_homeless !== false,
    homelessYears: (row.homeless_years as number) || 0,
    isFirstHome: row.is_first_home !== false,
    existingLoans: (row.existing_loans as number) || 0,
    creditScore: (row.credit_score as number) || 0,
    netAssets: (row.net_assets as number) || 0,
    note: (row.note as string) || "",
  };
}

function assetToRow(a: Omit<PersonAsset, "id">) {
  return {
    role: a.role,
    cash: a.cash,
    stocks: a.stocks,
    savings: a.savings,
    other_assets: a.otherAssets,
    other_note: a.otherNote,
    monthly_income: a.monthlyIncome,
    annual_income: a.annualIncome,
    age: a.age,
    is_homeless: a.isHomeless,
    homeless_years: a.homelessYears,
    is_first_home: a.isFirstHome,
    existing_loans: a.existingLoans,
    credit_score: a.creditScore,
    net_assets: a.netAssets,
    note: a.note,
    updated_at: new Date().toISOString(),
  };
}

export async function getAssets(groupId: string): Promise<PersonAsset[]> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("group_id", groupId)
    .order("role", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToAsset);
}

export async function upsertAsset(
  groupId: string,
  a: Omit<PersonAsset, "id">
): Promise<PersonAsset> {
  // Composite unique is (group_id, role)
  const { data, error } = await supabase
    .from("assets")
    .upsert({ ...assetToRow(a), group_id: groupId }, {
      onConflict: "group_id,role",
    })
    .select()
    .single();
  if (error) throw error;
  return rowToAsset(data);
}
