// ════════════════════════════════════════════════════════════════
// WeddingHall — simplified data model (2026-04-10)
// ════════════════════════════════════════════════════════════════
// The modal only captures the eight fields below. Derived/decorative
// info (priceLevel badges, KTX star rating, BEST banner, image, etc.)
// has been removed.
//
// `priceLevel` is now a DERIVED value, computed by comparing the hall
// price against the user's 'hall' budget category — see
// computePriceLevel() below.

export type TransportMode = "subway" | "bus" | "train";

export interface WeddingHall {
  id: number;
  name: string;
  sub: string; // 위치
  price: number; // 만원
  guests: number; // 보증인원
  parking: number; // 주차 대수
  transport: TransportMode[]; // 교통편
  note: string;
}

export const TRANSPORT_META: {
  id: TransportMode;
  label: string;
  icon: string;
}[] = [
  { id: "subway", label: "지하철", icon: "🚇" },
  { id: "bus", label: "버스", icon: "🚌" },
  { id: "train", label: "기차", icon: "🚆" },
];

/**
 * Derive a traffic-light style grade for a hall's price against the
 * user's 'hall' budget.
 *   - returns null when there is no meaningful comparison (no budget
 *     set yet, or no price entered) — caller should hide the indicator.
 *   - "ok"   — within budget
 *   - "warn" — up to 10% over budget
 *   - "over" — more than 10% over budget
 */
export function computePriceLevel(
  price: number,
  hallBudget: number
): "ok" | "warn" | "over" | null {
  if (!hallBudget || hallBudget <= 0) return null;
  if (!price || price <= 0) return null;
  if (price <= hallBudget) return "ok";
  if (price <= hallBudget * 1.1) return "warn";
  return "over";
}

