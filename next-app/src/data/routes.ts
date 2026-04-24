/**
 * 임장 동선 히스토리 타입 (Supabase routes 테이블용).
 * HousingRouteSection 제거 후 최소 타입만 유지.
 */

export interface RoutePayload {
  stops: number[];
  [key: string]: unknown;
}

export interface RouteHistory {
  id: number;
  name: string;
  visitedAt: string;
  payload: RoutePayload;
  note: string;
  createdAt: string;
  updatedAt: string;
}
