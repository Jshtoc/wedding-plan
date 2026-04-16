export type AssetRole = "groom" | "bride";

/**
 * 한 사람에게 귀속되는 직장(또는 자주 가는 장소)의 단위.
 * 출퇴근 시간 자동 계산에 사용되며, 본사/지점/프리랜서 사무실 등
 * 여러 개를 등록할 수 있다.
 */
export interface Workplace {
  label: string;    // 표시명 (예: "본사", "여의도 지점")
  address: string;  // 도로명 또는 지번
  lat: number;
  lng: number;
}

export interface PersonAsset {
  id: number;
  role: AssetRole;

  // 자산 현황
  cash: number;          // 현금/예금, 만원
  stocks: number;        // 주식/투자, 만원
  savings: number;       // 청약/적금, 만원
  otherAssets: number;   // 기타 자산, 만원
  otherNote: string;     // 기타 자산 설명

  // 소득
  monthlyIncome: number; // 월 소득, 만원
  annualIncome: number;  // 연 소득, 만원

  // 대출 심사 기본 정보
  age: number;
  isHomeless: boolean;       // 무주택 여부
  homelessYears: number;     // 무주택 기간 (년)
  isFirstHome: boolean;      // 생애최초 주택구입 여부
  existingLoans: number;     // 기존 대출 총액, 만원
  creditScore: number;       // 신용점수
  netAssets: number;         // 순자산, 만원

  // 직장 주소들 (출퇴근 시간 자동 계산용). 빈 배열이면 미등록.
  workplaces: Workplace[];

  note: string;
}

/** 한 사람의 총 자산 합계 */
export function totalAssets(a: PersonAsset): number {
  return a.cash + a.stocks + a.savings + a.otherAssets;
}

/** 부부합산 연소득 */
export function combinedAnnualIncome(groom: PersonAsset, bride: PersonAsset): number {
  return groom.annualIncome + bride.annualIncome;
}

/** 부부합산 총 자산 */
export function combinedTotalAssets(groom: PersonAsset, bride: PersonAsset): number {
  return totalAssets(groom) + totalAssets(bride);
}

export const ROLE_META: Record<AssetRole, { label: string; icon: string }> = {
  groom: { label: "신랑", icon: "🤵" },
  bride: { label: "신부", icon: "👰" },
};

export function emptyAsset(role: AssetRole): PersonAsset {
  return {
    id: 0,
    role,
    cash: 0,
    stocks: 0,
    savings: 0,
    otherAssets: 0,
    otherNote: "",
    monthlyIncome: 0,
    annualIncome: 0,
    age: 0,
    isHomeless: true,
    homelessYears: 0,
    isFirstHome: true,
    existingLoans: 0,
    creditScore: 0,
    netAssets: 0,
    workplaces: [],
    note: "",
  };
}
