"use client";

import { useMemo, useState } from "react";
import { Complex, jeonseRatio, gap, dropFromPeak } from "@/data/complexes";
import TwEmoji from "../ui/TwEmoji";
import HousingGuide from "./HousingGuide";

interface Props {
  complexes: Complex[];
  loading: boolean;
  onEdit: (complex: Complex) => void;
}

type SortType = "default" | "price" | "gap" | "name";

export default function HousingSection({
  complexes,
  loading,
  onEdit,
}: Props) {
  const [sortType, setSortType] = useState<SortType>("default");

  const sorted = useMemo(() => {
    const list = [...complexes];
    switch (sortType) {
      case "price":
        list.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case "gap":
        list.sort(
          (a, b) => (gap(a) ?? Infinity) - (gap(b) ?? Infinity)
        );
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
        break;
      default:
        list.sort((a, b) => a.salePrice - b.salePrice);
        break;
    }
    return list;
  }, [complexes, sortType]);

  const sortOptions: { type: SortType; label: string }[] = [
    { type: "default", label: "기본" },
    { type: "price", label: "매매가 낮은순" },
    { type: "gap", label: "갭 적은순" },
    { type: "name", label: "이름순" },
  ];

  if (loading) return <SkeletonGrid />;

  return (
    <div>
      {/* Guide */}
      <HousingGuide />

      {/* Sort bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
        {sortOptions.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setSortType(opt.type)}
            className={
              "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors " +
              (sortType === opt.type
                ? "bg-mint text-gray-900"
                : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((c) => (
            <ComplexCard key={c.id} complex={c} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Complex card ──────────────────────────────────────────── */

interface ComplexCardProps {
  complex: Complex;
  onEdit: (complex: Complex) => void;
}

function ComplexCard({ complex, onEdit }: ComplexCardProps) {
  const [expanded, setExpanded] = useState(false);
  const c = complex;
  const ratio = jeonseRatio(c);
  const gapValue = gap(c);
  const drop = dropFromPeak(c);

  const location = [c.city, c.district, c.dong].filter(Boolean).join(" ");

  return (
    <div className="text-left bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
      {/* Top row: name + candidate badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
          <TwEmoji emoji={c.isCandidate ? "⭐" : "🏠"} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white leading-tight truncate">
              {c.name}
            </h3>
            {c.isCandidate && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-mint/15 text-mint text-[10px] font-semibold border border-mint/30">
                임장 후보
              </span>
            )}
          </div>
          {location && (
            <p className="text-[11px] text-white/50 mt-1 truncate">
              {location}
            </p>
          )}
          {c.yearUnits && (
            <p className="text-[10px] text-white/35 mt-0.5 truncate">
              {c.yearUnits} · {c.area}
            </p>
          )}
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <PriceStat label="매매가" value={c.salePrice} accent />
        <PriceStat label="전세가" value={c.jeonsePrice} />
        <PriceStat label="전고점" value={c.peakPrice} />
        <PriceStat label="직전 실거래" value={c.lastTradePrice} />
      </div>

      {/* Derived stats row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {gapValue !== null && (
          <StatBadge label="갭" value={formatPrice(gapValue)} />
        )}
        {ratio !== null && (
          <StatBadge label="전세가율" value={`${ratio}%`} />
        )}
        {drop !== null && drop > 0 && (
          <StatBadge
            label="고점대비"
            value={`-${drop}%`}
            variant="accent"
          />
        )}
      </div>

      {/* ── Expandable detail area ── */}
      <div
        className={
          "grid transition-[grid-template-rows] duration-300 ease-out " +
          (expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
        }
      >
        <div className="overflow-hidden">
          <div className="pt-3 border-t border-white/5 space-y-4">
            {/* 전저점 */}
            {c.lowPrice > 0 && (
              <div className="grid grid-cols-2 gap-x-4">
                <PriceStat label="전저점" value={c.lowPrice} />
              </div>
            )}

            {/* 교통/직장 */}
            {(c.commuteTime || c.subwayLine || c.workplace1 || c.workplace2) && (
              <DetailSection icon="🚇" title="교통 / 직장">
                <DetailRow label="강남역까지" value={c.commuteTime} />
                <DetailRow label="전철 노선" value={c.subwayLine} />
                <DetailRow label="직장1 (본인)" value={c.workplace1} />
                <DetailRow label="직장2 (배우자)" value={c.workplace2} />
              </DetailSection>
            )}

            {/* 학군 */}
            {c.schoolScore && (
              <DetailSection icon="🎓" title="학군">
                <DetailRow label="중학교 학업성취도" value={c.schoolScore} />
              </DetailSection>
            )}

            {/* 환경 */}
            {(c.hazard || c.amenities || c.isNewBuild) && (
              <DetailSection icon="🏙️" title="환경">
                <DetailRow label="유해시설" value={c.hazard} />
                <DetailRow label="편의시설" value={c.amenities} />
                <DetailRow label="5년 이내 신축" value={c.isNewBuild} />
              </DetailSection>
            )}

            {/* 메모 */}
            {c.note && (
              <DetailSection icon="📝" title="메모">
                <p className="text-[12px] text-white/60 leading-relaxed whitespace-pre-wrap">
                  {c.note}
                </p>
              </DetailSection>
            )}

            {/* 편집 버튼 */}
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="w-full h-10 rounded-xl text-xs font-medium text-white/60 hover:text-mint bg-white/[0.03] border border-white/10 hover:bg-mint/5 hover:border-mint/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 1.5l2 2L4 10H2v-2z" />
              </svg>
              편집하기
            </button>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 pt-3 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-[11px] text-white/40 hover:text-mint/80 transition-colors"
      >
        {expanded ? "접기" : "펼쳐서 보기"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            "transition-transform duration-300 " +
            (expanded ? "rotate-180" : "")
          }
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>
    </div>
  );
}

/* ── Detail sub-components ─────────────────────────────────── */

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <TwEmoji emoji={icon} size={12} />
        <span className="text-[10px] font-semibold text-mint/70 tracking-[0.15em] uppercase">
          {title}
        </span>
      </div>
      <div className="space-y-1.5 pl-0.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <span className="text-white/35 flex-shrink-0 min-w-[90px]">{label}</span>
      <span className="text-white/70 whitespace-pre-wrap">{value}</span>
    </div>
  );
}

/* ── Shared small components ───────────────────────────────── */

/** 만원 단위 → "5억 9,500만" / "3,800만" 형식 */
function formatPrice(value: number): string {
  const eok = Math.floor(value / 10000);
  const man = value % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString()}만`;
}

function PriceStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-white/40">{label}</div>
      <div
        className={
          "text-sm font-semibold tabular-nums " +
          (accent && value > 0 ? "text-mint" : "text-white/80")
        }
      >
        {value > 0 ? formatPrice(value) : "—"}
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "accent";
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium " +
        (variant === "accent"
          ? "bg-mint/10 text-mint border border-mint/20"
          : "bg-white/[0.04] text-white/60 border border-white/10")
      }
    >
      <span className="text-white/40">{label}</span> {value}
    </span>
  );
}

/* ── Skeleton + empty state ─────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 animate-pulse space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/[0.06] rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/[0.06] rounded w-2/3" />
              <div className="h-3 bg-white/[0.04] rounded w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-white/[0.04] rounded" />
            <div className="h-8 bg-white/[0.04] rounded" />
          </div>
          <div className="h-3 bg-white/[0.04] rounded w-full" />
        </div>
      ))}
    </div>
  );
}

const SAMPLE_COMPLEX: Complex = {
  id: -1,
  name: "래미안 퍼스티지",
  city: "서울",
  district: "강남구",
  dong: "개포동",
  yearUnits: "2021년 / 1,957세대",
  area: "84㎡",
  salePrice: 29500,
  jeonsePrice: 16000,
  peakPrice: 32000,
  lowPrice: 22000,
  lastTradePrice: 28800,
  commuteTime: "15분",
  subwayLine: "3호선 대치역",
  workplace1: "",
  workplace2: "",
  schoolScore: "A",
  hazard: "없음",
  amenities: "대형마트, 공원",
  isNewBuild: "O",
  isCandidate: true,
  note: "역세권 + 학군 우수. 갭 1.35억.",
};

function EmptyState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative pointer-events-none select-none" aria-hidden="true">
          <div className="rounded-2xl sample-glow">
            <ComplexCard complex={SAMPLE_COMPLEX} onEdit={() => {}} />
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-mint/20 backdrop-blur-sm text-mint text-[10px] font-semibold tracking-wider border border-mint/30">
            예시
          </div>
        </div>
      </div>
      <div className="text-center py-4 text-sm text-white/40">
        우측 하단 + 버튼을 눌러 관심 단지를 추가해보세요
      </div>
    </div>
  );
}
