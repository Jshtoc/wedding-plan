/**
 * 임장 동선 저장 히스토리의 타입 정의. 실제 경로 계획 상태는 payload에
 * JSONB로 통째로 저장하고, 화면용 메타데이터(name, visited_at, note)만
 * 컬럼으로 분리한다.
 */

import type { AddressResult } from "@/app/components/ui/AddressSearch";

/** HousingRouteSection 의 저장 가능한 상태 스냅샷. */
export interface RoutePayload {
  start: AddressResult | null;
  end: AddressResult | null;
  endSame: boolean;
  stops: number[]; // 방문 순서대로 정렬된 complex id 배열
  dep: string; // "HH:MM"
  view: number; // 매물당 관람 시간 (분)
  meal?: number; // 중간 식사 휴식 (분). 0 또는 undefined면 비활성.
  /**
   * 저장 시점의 계산 결과 (distance / duration / cost). 선택 필드 —
   * 히스토리 리스트에서 재계산 없이 요약을 보여주기 위해 캐시.
   */
  result?: {
    totalDistance: number;
    totalDuration: number;
    totalTollFare: number;
    totalFuelPrice: number;
    totalTaxiFare: number;
  };
}

export interface RouteHistory {
  id: number;
  name: string;
  /** YYYY-MM-DD (date) or empty string when not set. */
  visitedAt: string;
  payload: RoutePayload;
  note: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  updatedAt: string;
}

/** 간단한 요약 문자열. 예: "3곳 · 84km · 2시간 30분" */
export function summarizeRoute(r: RouteHistory): string {
  const stopCount = r.payload.stops?.length ?? 0;
  const res = r.payload.result;
  const parts: string[] = [];
  parts.push(`${stopCount}곳`);
  if (res?.totalDistance) {
    parts.push(
      res.totalDistance >= 1000
        ? `${(res.totalDistance / 1000).toFixed(1)}km`
        : `${Math.round(res.totalDistance)}m`
    );
  }
  if (res?.totalDuration) {
    const min = Math.round(res.totalDuration / 60000);
    if (min < 60) parts.push(`${min}분`);
    else {
      const h = Math.floor(min / 60);
      const m = min % 60;
      parts.push(m > 0 ? `${h}시간 ${m}분` : `${h}시간`);
    }
  }
  return parts.join(" · ");
}
