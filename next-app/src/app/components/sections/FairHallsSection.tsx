"use client";

import { useState } from "react";

interface FairHall {
  name: string;
  star: number; // 0, 1, 2
  traffic: string;
  parking: number;
  features: string;
  mealType: string;
  mealPrice: number;      // 1인 식대 (원)
  rentalFee: string;      // 대관료 표시용 문자열
  rentalFeeNum: number;   // 대관료 계산용 (만원)
  duration: string;
  minGuests: number;
}

interface District {
  name: string;
  halls: FairHall[];
}

// 예상 견적 = 대관료 + 식대 × 최소보증인원 (만원 단위)
function calcEstimate(hall: FairHall): number {
  return hall.rentalFeeNum + Math.round((hall.mealPrice / 10000) * hall.minGuests);
}

const DISTRICTS: District[] = [
  {
    name: "강남구",
    halls: [
      {
        name: "아르베",
        star: 1,
        traffic: "선정릉역 도보 7분",
        parking: 250,
        features: "식사Good · 긴 버진로드 · 조명 어둡게 조절 가능",
        mealType: "뷔페(분리)",
        mealPrice: 88000,
        rentalFee: "880만원",
        rentalFeeNum: 880,
        duration: "2시간",
        minGuests: 200,
      },
      {
        name: "더휴",
        star: 0,
        traffic: "선릉역 도보 1분",
        parking: 450,
        features: "넓고 긴 버진로드 · 26년 1월 오픈 예정",
        mealType: "뷔페(분리)",
        mealPrice: 85000,
        rentalFee: "850만원",
        rentalFeeNum: 850,
        duration: "90분",
        minGuests: 200,
      },
      {
        name: "라온제나",
        star: 0,
        traffic: "강남구청역 도보 3분",
        parking: 400,
        features: "야외예식 가능 · 버진로드 22M · 가성비",
        mealType: "뷔페(분리)",
        mealPrice: 70000,
        rentalFee: "770만원",
        rentalFeeNum: 770,
        duration: "90분",
        minGuests: 250,
      },
    ],
  },
  {
    name: "서초구",
    halls: [
      {
        name: "브라이드밸리",
        star: 1,
        traffic: "양재역 도보 2분",
        parking: 250,
        features: "버진로드 25M",
        mealType: "뷔페(분리)",
        mealPrice: 85000,
        rentalFee: "850만원",
        rentalFeeNum: 850,
        duration: "90분",
        minGuests: 250,
      },
      {
        name: "더화이트베일",
        star: 1,
        traffic: "남부터미널역 도보 3분",
        parking: 600,
        features: "식사Good · 교통Good · 단독홀",
        mealType: "한정식(분리)",
        mealPrice: 85000,
        rentalFee: "850만원",
        rentalFeeNum: 850,
        duration: "90분",
        minGuests: 250,
      },
      {
        name: "AT포레 웨딩홀",
        star: 0,
        traffic: "양재시민의숲역 도보 1분",
        parking: 500,
        features: "천고 7M · 버진로드 22M · 단독홀 (연회장 2곳, 식사 안겹침)",
        mealType: "뷔페(분리)",
        mealPrice: 75000,
        rentalFee: "750만원",
        rentalFeeNum: 750,
        duration: "90분",
        minGuests: 300,
      },
      {
        name: "엘로라인가든",
        star: 0,
        traffic: "장지역 도보 5분",
        parking: 1500,
        features: "층고 4M · 버진로드 20M",
        mealType: "뷔페(분리)",
        mealPrice: 79000,
        rentalFee: "790만원",
        rentalFeeNum: 790,
        duration: "90분",
        minGuests: 200,
      },
    ],
  },
  {
    name: "성동구·동대문구",
    halls: [
      {
        name: "더베네치아",
        star: 0,
        traffic: "잠실역 도보 3분",
        parking: 300,
        features: "가성비 · 식사Good",
        mealType: "뷔페(분리)",
        mealPrice: 69000,
        rentalFee: "650만원",
        rentalFeeNum: 650,
        duration: "80분",
        minGuests: 200,
      },
      {
        name: "레노스블랑쉬",
        star: 0,
        traffic: "왕십리역 도보 10분",
        parking: 500,
        features: "가성비",
        mealType: "뷔페(분리)",
        mealPrice: 55000,
        rentalFee: "330만원",
        rentalFeeNum: 330,
        duration: "60분",
        minGuests: 200,
      },
      {
        name: "H스퀘어 (한양대동문회관)",
        star: 0,
        traffic: "한양대역 도보 7분",
        parking: 300,
        features: "—",
        mealType: "한식(분리)",
        mealPrice: 73000,
        rentalFee: "700만원",
        rentalFeeNum: 700,
        duration: "90분",
        minGuests: 250,
      },
      {
        name: "벨라루체 웨딩홀",
        star: 0,
        traffic: "회기역 도보 3분",
        parking: 500,
        features: "교통 편리 · 3가지 스타일 프라이빗 하우스",
        mealType: "뷔페(분리)",
        mealPrice: 77000,
        rentalFee: "770만원",
        rentalFeeNum: 770,
        duration: "80분",
        minGuests: 200,
      },
    ],
  },
  {
    name: "광진구",
    halls: [
      {
        name: "웨딩스퀘어 강변점",
        star: 0,
        traffic: "강변역 도보 4분",
        parking: 2500,
        features: "홀 4개 · 지하철 연결 · 테크노마트 내 위치",
        mealType: "뷔페(분리)",
        mealPrice: 75000,
        rentalFee: "750만원",
        rentalFeeNum: 750,
        duration: "80분",
        minGuests: 250,
      },
      {
        name: "KU컨벤션웨딩홀",
        star: 0,
        traffic: "건대 인근",
        parking: 1000,
        features: "식사Good · 연회장 2개 각각 다른 층 (하객 안겹침)",
        mealType: "뷔페(분리)",
        mealPrice: 85000,
        rentalFee: "900만원",
        rentalFeeNum: 900,
        duration: "80분",
        minGuests: 250,
      },
      {
        name: "하우스오브더라움",
        star: 2,
        traffic: "건대입구역 도보 2분",
        parking: 300,
        features: "프리미엄 웨딩홀",
        mealType: "뷔페(분리)",
        mealPrice: 110000,
        rentalFee: "1,200만원",
        rentalFeeNum: 1200,
        duration: "120분",
        minGuests: 200,
      },
    ],
  },
  {
    name: "구로구",
    halls: [
      {
        name: "웨딩시티 신도림점",
        star: 0,
        traffic: "구로역 도보 3분",
        parking: 2500,
        features: "층고 10M · 신도림역 역사 연결",
        mealType: "뷔페(분리)",
        mealPrice: 63000,
        rentalFee: "800만원 (+연출료 최대 30만원)",
        rentalFeeNum: 800,
        duration: "70분",
        minGuests: 220,
      },
      {
        name: "구로명품웨딩프로포즈",
        star: 0,
        traffic: "구로역 도보 8분",
        parking: 700,
        features: "가성비",
        mealType: "뷔페(분리)",
        mealPrice: 65000,
        rentalFee: "550만원",
        rentalFeeNum: 550,
        duration: "토 70분 / 일 60분",
        minGuests: 150,
      },
      {
        name: "제이오스티엘",
        star: 1,
        traffic: "구로역 도보 5분",
        parking: 3000,
        features: "가성비",
        mealType: "뷔페(분리)",
        mealPrice: 58000,
        rentalFee: "350만원",
        rentalFeeNum: 350,
        duration: "60분",
        minGuests: 150,
      },
      {
        name: "웨스턴베니비스 신도림",
        star: 0,
        traffic: "신도림역 도보 4분",
        parking: 2500,
        features: "식사Good · 홀 3개 · 테크노마트 7층",
        mealType: "뷔페(분리)",
        mealPrice: 75000,
        rentalFee: "750만원",
        rentalFeeNum: 750,
        duration: "70~80분",
        minGuests: 250,
      },
    ],
  },
  {
    name: "영등포구",
    halls: [
      {
        name: "웨딩 여울리",
        star: 0,
        traffic: "여의도역 도보 5분",
        parking: 400,
        features: "식사Good · 천고 낮은편 · 버진로드 20M",
        mealType: "뷔페",
        mealPrice: 93000,
        rentalFee: "1,050만원",
        rentalFeeNum: 1050,
        duration: "70분",
        minGuests: 300,
      },
      {
        name: "규수당",
        star: 0,
        traffic: "문래역 도보 9분",
        parking: 1400,
        features: "층고 6M · 버진로드 24M · 식사Good",
        mealType: "뷔페",
        mealPrice: 65000,
        rentalFee: "580만원",
        rentalFeeNum: 580,
        duration: "70분",
        minGuests: 200,
      },
      {
        name: "베뉴비안",
        star: 1,
        traffic: "신풍역 도보 2분",
        parking: 300,
        features: "식사Good · 가성비",
        mealType: "뷔페",
        mealPrice: 60000,
        rentalFee: "250~260만원",
        rentalFeeNum: 255,
        duration: "60분",
        minGuests: 80,
      },
    ],
  },
];

type FilterType = "all" | "range-1-2" | "range-2-3" | "range-3-4" | "range-4up";
type SortType = "default" | "estimate-asc" | "estimate-desc";

const FILTER_CONFIG: { type: FilterType; label: string; min: number; max: number }[] = [
  { type: "all",       label: "전체",          min: 0,    max: Infinity },
  { type: "range-1-2", label: "1000~2000만원", min: 1000, max: 2000 },
  { type: "range-2-3", label: "2000~3000만원", min: 2000, max: 3000 },
  { type: "range-3-4", label: "3000~4000만원", min: 3000, max: 4000 },
  { type: "range-4up", label: "4000만원 이상", min: 4000, max: Infinity },
];

export default function FairHallsSection() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("default");

  const allHalls: (FairHall & { district: string })[] = DISTRICTS.flatMap((d) =>
    d.halls.map((h) => ({ ...h, district: d.name }))
  );

  const { min: fMin, max: fMax } = FILTER_CONFIG.find((c) => c.type === filter)!;
  const filtered = allHalls.filter((h) => {
    const est = calcEstimate(h);
    return est >= fMin && est < fMax;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "estimate-asc") return calcEstimate(a) - calcEstimate(b);
    if (sort === "estimate-desc") return calcEstimate(b) - calcEstimate(a);
    return 0; // default: original district order
  });

  // Group by district preserving sort order
  const grouped: Map<string, (FairHall & { district: string })[]> = new Map();
  if (sort === "default") {
    // Group by district in original order
    for (const d of DISTRICTS) {
      const halls = sorted.filter((h) => h.district === d.name);
      if (halls.length > 0) grouped.set(d.name, halls);
    }
  } else {
    // Flat list when sorted by estimate
    grouped.set("__flat__", sorted);
  }

  const estimates = sorted.map(calcEstimate);
  const minEst = Math.min(...estimates);
  const maxEst = Math.max(...estimates);

  return (
    <div className="space-y-6">
      {/* 출처 안내 */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-mint/[0.05] border border-mint/20">
        <span className="text-mint text-lg leading-none mt-0.5">📋</span>
        <div>
          <div className="text-xs font-semibold text-mint mb-0.5">웨딩박람회 홀 리스트</div>
          <div className="text-[11px] text-white/50 leading-relaxed">
            정승호 신랑님 · 곽다운 신부님 맞춤 추천 리스트 · 총 21개 홀 · 6개 구
            <span className="ml-2 text-white/30">예상견적 = 대관료 + 식대 × 최소보증인원</span>
          </div>
        </div>
      </div>

      {/* 필터 + 정렬 바 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-2">
          {FILTER_CONFIG.map(({ type, label }) => {
            const count = type === "all"
              ? allHalls.length
              : allHalls.filter((h) => { const e = calcEstimate(h); const cfg = FILTER_CONFIG.find(c => c.type === type)!; return e >= cfg.min && e < cfg.max; }).length;
            const displayLabel = type === "all" ? `전체 (${count})` : `${label} (${count})`;
            const f = type;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors " +
                  (filter === f
                    ? "bg-mint text-gray-900"
                    : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white")
                }
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {(["default", "estimate-asc", "estimate-desc"] as SortType[]).map((s) => {
            const labels: Record<SortType, string> = {
              default: "구별",
              "estimate-asc": "저렴한순",
              "estimate-desc": "비싼순",
            };
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors " +
                  (sort === s
                    ? "bg-white/15 text-white border border-white/30"
                    : "text-white/40 border border-white/10 hover:text-white/60")
                }
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 홀 목록 */}
      {sort === "default" ? (
        <div className="space-y-4">
          {[...grouped.entries()].map(([districtName, halls]) => (
            <DistrictGroup key={districtName} name={districtName} halls={halls} minEst={minEst} maxEst={maxEst} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
          {sorted.map((hall, i) => (
            <HallRow key={hall.name} hall={hall} rank={i + 1} showDistrict minEst={minEst} maxEst={maxEst} />
          ))}
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-white/40">
        <div className="flex items-center gap-1.5">
          <StarBadge count={2} />
          <span>최우선 추천</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StarBadge count={1} />
          <span>추천</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>예상견적 최저가</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span>예상견적 최고가</span>
        </div>
      </div>
    </div>
  );
}

function DistrictGroup({
  name,
  halls,
  minEst,
  maxEst,
}: {
  name: string;
  halls: (FairHall & { district: string })[];
  minEst: number;
  maxEst: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-mint font-bold text-sm">{name}</span>
          <span className="text-[11px] text-white/40">{halls.length}개 홀</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={"text-white/40 transition-transform duration-200 " + (open ? "rotate-180" : "rotate-0")}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-white/[0.06]">
          {halls.map((hall) => (
            <HallRow key={hall.name} hall={hall} minEst={minEst} maxEst={maxEst} />
          ))}
        </div>
      )}
    </div>
  );
}

function HallRow({
  hall,
  rank,
  showDistrict,
  minEst,
  maxEst,
}: {
  hall: FairHall & { district?: string };
  rank?: number;
  showDistrict?: boolean;
  minEst: number;
  maxEst: number;
}) {
  const estimate = calcEstimate(hall);
  const isMin = estimate === minEst;
  const isMax = estimate === maxEst;
  const estimateColor = isMin
    ? "text-emerald-400"
    : isMax
    ? "text-red-400"
    : estimate < 2000
    ? "text-emerald-300"
    : estimate < 2500
    ? "text-amber-300"
    : "text-white/80";

  const mealInManwon = Math.round((hall.mealPrice / 10000) * hall.minGuests);

  return (
    <div className="px-5 py-4 bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
      {/* 이름 + 별 + 예상견적 */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {rank !== undefined && (
            <span className="flex-shrink-0 text-[10px] font-bold text-white/30 tabular-nums w-5">
              {rank}.
            </span>
          )}
          {hall.star > 0 && (
            <span className="flex-shrink-0 text-amber-400 font-bold text-xs leading-none">
              {"★".repeat(hall.star)}
            </span>
          )}
          <span className="text-sm font-semibold text-white">{hall.name}</span>
          {showDistrict && hall.district && (
            <span className="text-[10px] text-mint/60 bg-mint/10 px-1.5 py-0.5 rounded-full">
              {hall.district}
            </span>
          )}
        </div>
        {/* 예상 견적 */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-base font-bold tabular-nums ${estimateColor}`}>
            {estimate.toLocaleString()}만원
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">예상견적</div>
        </div>
      </div>

      {/* 교통 + 주차 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[11px] text-white/50">
        <span className="flex items-center gap-1">
          <span className="text-mint/70">🚇</span>
          {hall.traffic}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-mint/70">🅿️</span>
          주차 {hall.parking.toLocaleString()}대
        </span>
      </div>

      {/* 특징 */}
      {hall.features && hall.features !== "—" && (
        <div className="text-[11px] text-white/40 mb-2.5 leading-relaxed">
          {hall.features}
        </div>
      )}

      {/* 견적 계산 내역 */}
      <div className="flex flex-wrap gap-x-1 gap-y-1 text-[11px] items-center">
        <span className="text-white/40">대관료</span>
        <span className="text-white/70 font-medium">{hall.rentalFee}</span>
        <span className="text-white/25 mx-1">+</span>
        <span className="text-white/40">{hall.mealType}</span>
        <span className="text-white/70 font-medium tabular-nums">
          {(hall.mealPrice / 10000).toFixed(1)}만
        </span>
        <span className="text-white/25">×</span>
        <span className="text-white/70 font-medium tabular-nums">{hall.minGuests}명</span>
        <span className="text-white/25 mx-1">=</span>
        <span className="text-white/40">{hall.rentalFeeNum}만</span>
        <span className="text-white/25">+</span>
        <span className="text-white/40 tabular-nums">{mealInManwon}만</span>
        <span className="text-white/25 mx-0.5">=</span>
        <span className={`font-bold tabular-nums ${estimateColor}`}>
          {estimate.toLocaleString()}만원
        </span>
        <span className="text-white/30 ml-1">({hall.duration})</span>
      </div>
    </div>
  );
}

function StarBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold text-xs leading-none">
      {"★".repeat(count)}
    </span>
  );
}
