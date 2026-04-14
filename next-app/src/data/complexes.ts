// ════════════════════════════════════════════════════════════════
// Complex — apartment complex data model (2026-04-12)
// ════════════════════════════════════════════════════════════════
// Based on 월부 "내집마련보고서" spreadsheet structure.
// Combines basic info (단지정보) and location analysis (입지분석).

export interface Complex {
  id: number;

  // 단지정보
  name: string;           // 단지명
  city: string;           // 시
  district: string;       // 구
  dong: string;           // 동
  yearUnits: string;      // 연식 / 세대수
  area: string;           // 공급/전용면적
  salePrice: number;      // 매매가 (호가), 만원
  pyeongPrice: number;    // 평단가, 만원
  jeonsePrice: number;    // 전세가, 만원
  peakPrice: number;      // 전고점, 만원
  lowPrice: number;       // 전저점, 만원
  lastTradePrice: number; // 직전 실거래가, 만원

  // 입지분석
  commuteTime: string;    // 강남역까지 소요시간
  subwayLine: string;     // 전철 노선
  workplace1: string;     // 직장1 (본인)
  workplace2: string;     // 직장2 (배우자)
  schoolScore: string;    // 근처 중학교 학업성취도
  hazard: string;         // 유해시설 여부
  amenities: string;      // 편의시설
  isNewBuild: string;     // 5년 이내 신축 여부
  isCandidate: boolean;   // 임장 후보
  note: string;           // 메모

  // 주소 검색으로 채워지는 좌표 + 도로명주소
  lat?: number;
  lng?: number;
  address?: string;       // 도로명주소 (검색 결과)
}

// ── School entries (stored as JSON string in schoolScore column) ──

export interface SchoolEntry {
  name: string;
  score: number; // 학업성취율 %
}

/** Parse schoolScore JSON string → SchoolEntry[].
 *  Handles legacy plain-text values like "A" or "85%". */
export function parseSchools(raw: string): SchoolEntry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch {
    // not JSON — legacy format
  }
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (num > 0) return [{ name: "", score: num }];
  if (raw.trim()) return [{ name: raw.trim(), score: 0 }];
  return [];
}

/** Highest school score for comparison chart. */
export function maxSchoolScore(c: Complex): number {
  const schools = parseSchools(c.schoolScore);
  if (schools.length === 0) return 0;
  return Math.max(...schools.map((s) => s.score));
}

/** 전세가율 (%) — 전세가/매매가 × 100 */
export function jeonseRatio(c: Complex): number | null {
  if (!c.salePrice || c.salePrice <= 0 || !c.jeonsePrice) return null;
  return Math.round((c.jeonsePrice / c.salePrice) * 100);
}

/** 갭 (매매가 − 전세가), 만원 */
export function gap(c: Complex): number | null {
  if (!c.salePrice || !c.jeonsePrice) return null;
  return c.salePrice - c.jeonsePrice;
}

/** 전고점 대비 현재 매매가 하락률 (%) */
export function dropFromPeak(c: Complex): number | null {
  if (!c.peakPrice || c.peakPrice <= 0 || !c.salePrice) return null;
  return Math.round(((c.peakPrice - c.salePrice) / c.peakPrice) * 100);
}
