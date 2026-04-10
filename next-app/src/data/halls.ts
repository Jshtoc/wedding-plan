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

// ─── Route (legacy tour view — kept for RouteTab.tsx which is not wired
// into the dashboard but still present in the repo) ─────────────────
export interface RouteStop {
  type: "start" | "stop" | "end";
  number?: number;
  name: string;
  address: string;
  tip?: string;
  price?: string;
  priceLevel?: "ok" | "warn" | "over";
  tags?: string[];
  isBest?: boolean;
  bestLabel?: string;
}

export interface RouteDrive {
  text: string;
}

export type RouteItem =
  | { kind: "stop"; data: RouteStop }
  | { kind: "drive"; data: RouteDrive };

export const routeItems: RouteItem[] = [
  { kind: "stop", data: { type: "start", name: "목동 (출발)", address: "서울 양천구 목동", tip: "오전 10시 출발 권장 — 점심 전 3곳, 점심 후 3곳" } },
  { kind: "drive", data: { text: "🚗 약 10분 · 3km" } },
  { kind: "stop", data: { type: "stop", number: 1, name: "더뉴컨벤션 웨딩", address: "서울 강서구 강서로 385 (내발산동)", price: "2,676만", priceLevel: "over", tags: ["5호선 발산역 3분", "주차 600대", "르노브홀 / 더뉴홀"], tip: "목동에서 가장 가까움. 발산역 바로 앞." } },
  { kind: "drive", data: { text: "🚗 약 15분 · 8km" } },
  { kind: "stop", data: { type: "stop", number: 2, name: "웨딩시티 신도림", address: "서울 구로구 경인로 662 신도림테크노마트 8층", price: "2,375만", priceLevel: "warn", tags: ["1·2호선 신도림역", "주차 2,000대", "토다이 뷔페"], tip: "테크노마트 건물 8층. 주차 넉넉." } },
  { kind: "drive", data: { text: "🚗 약 8분 · 3km" } },
  { kind: "stop", data: { type: "stop", number: 3, name: "제이오스티엘", address: "서울 구로구 구로중앙로 152 (구로동)", price: "1,367만", priceLevel: "ok", tags: ["1호선 구로역 2분", "주차 3,000대", "단독홀"], isBest: true, bestLabel: "★ 가격 1위 추천", tip: "신도림에서 바로 옆. 같이 보기 좋은 위치." } },
  { kind: "drive", data: { text: "🚗 약 30분 · 16km" } },
  { kind: "stop", data: { type: "stop", number: 4, name: "SW 컨벤션센터", address: "서울 종로구 종로 300 (창신동)", price: "1,390만", priceLevel: "ok", tags: ["1·6호선 동묘앞역 1분", "주차 500대", "11층 스카이뷰"], tip: "이동이 가장 긴 구간. 점심 후 이동 추천." } },
  { kind: "drive", data: { text: "🚗 약 25분 · 14km" } },
  { kind: "stop", data: { type: "stop", number: 5, name: "DMC 타워 웨딩", address: "서울 마포구 성암로 189 (상암동)", price: "2,134만", priceLevel: "warn", tags: ["6호선·공항철도 DMC역", "주차 500대", "홀 3종"], tip: "동묘앞에서 서쪽으로 이동. 상암 DMC 단지 내." } },
  { kind: "drive", data: { text: "🚗 약 12분 · 5km" } },
  { kind: "stop", data: { type: "stop", number: 6, name: "아만티호텔 서울", address: "서울 마포구 월드컵북로 31 (서교동)", price: "3,160만", priceLevel: "over", tags: ["2호선 홍대입구역", "주차 300대", "120분 단독 채플"], tip: "DMC에서 가까움. 홍대 주변이라 투어 후 식사하기 좋음." } },
  { kind: "drive", data: { text: "🚗 약 15분 · 6km" } },
  { kind: "stop", data: { type: "end", name: "목동 복귀", address: "서울 양천구 목동", tip: "총 이동시간 약 2시간 · 투어 포함 약 5~6시간 예상" } },
];
