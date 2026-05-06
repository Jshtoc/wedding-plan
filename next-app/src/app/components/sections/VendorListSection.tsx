"use client";

import { useMemo, useState } from "react";
import {
  DRESS_TARGET_META,
  DressTarget,
  Vendor,
  VENDOR_CATEGORIES,
  VendorCategory,
} from "@/data/vendors";
import TwEmoji from "../ui/TwEmoji";

interface Props {
  category: VendorCategory;
  vendors: Vendor[];
  loading: boolean;
  onEdit: (vendor: Vendor) => void;
}

type SortType = "default" | "price" | "name";
type ViewMode = "expanded" | "summary";

export default function VendorListSection({
  category,
  vendors,
  loading,
  onEdit,
}: Props) {
  const meta = VENDOR_CATEGORIES[category];
  const [sortType, setSortType] = useState<SortType>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("expanded");
  // Dress-only sub-tab. Ignored for studio/makeup.
  const [dressTab, setDressTab] = useState<DressTarget>("bride");

  const filtered = useMemo(() => {
    if (category !== "dress") return vendors;
    return vendors.filter((v) => (v.target ?? "bride") === dressTab);
  }, [vendors, category, dressTab]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortType) {
      case "price":
        list.sort((a, b) => a.price - b.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
        break;
      default:
        list.sort((a, b) => a.price - b.price);
        break;
    }
    return list;
  }, [filtered, sortType]);

  const sortOptions: { type: SortType; label: string }[] = [
    { type: "default", label: "기본" },
    { type: "price", label: "가격 낮은순" },
    { type: "name", label: "이름순" },
  ];

  if (loading) return <SkeletonGrid />;

  return (
    <div>
      {/* Dress sub-tab (groom / bride) */}
      {category === "dress" && (
        <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-5">
          {(Object.keys(DRESS_TARGET_META) as DressTarget[]).map((t) => {
            const m = DRESS_TARGET_META[t];
            const active = dressTab === t;
            const count = vendors.filter(
              (v) => (v.target ?? "bride") === t
            ).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setDressTab(t)}
                className={
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors " +
                  (active
                    ? "bg-mint text-gray-900"
                    : "text-white/60 hover:text-white")
                }
                aria-pressed={active}
              >
                <TwEmoji emoji={m.icon} size={14} /> {m.label}
                <span className="text-[10px] opacity-60 tabular-nums">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sort bar + view toggle */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
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
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {sorted.length === 0 ? (
        <SampleEmptyState category={category} />
      ) : (
        <div className={`grid gap-3 ${viewMode === "summary" ? "sm:grid-cols-2" : ""}`}>
          {sorted.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              categoryIcon={meta.icon}
              expanded={viewMode === "expanded"}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── View toggle ────────────────────────────────────────────── */

interface ViewToggleProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex-shrink-0 inline-flex p-0.5 bg-white/[0.04] border border-white/10 rounded-lg">
      <button
        type="button"
        onClick={() => onChange("summary")}
        aria-label="요약본 보기"
        title="요약본 보기"
        className={
          "flex items-center justify-center w-8 h-7 rounded-md transition-colors " +
          (value === "summary" ? "bg-mint/20 text-mint" : "text-white/40 hover:text-white/70")
        }
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="4" height="12" rx="1" />
          <rect x="7" y="1" width="4" height="12" rx="1" />
          <rect x="12" y="1" width="1" height="12" rx="0.5" className="opacity-0" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange("expanded")}
        aria-label="펼쳐서 보기"
        title="펼쳐서 보기"
        className={
          "flex items-center justify-center w-8 h-7 rounded-md transition-colors " +
          (value === "expanded" ? "bg-mint/20 text-mint" : "text-white/40 hover:text-white/70")
        }
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
          <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" />
          <rect x="1" y="7.5" width="5.5" height="5.5" rx="1" />
          <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" />
        </svg>
      </button>
    </div>
  );
}

/* ── Vendor card ────────────────────────────────────────────── */

interface VendorCardProps {
  vendor: Vendor;
  categoryIcon: string;
  expanded: boolean;
  onEdit: (vendor: Vendor) => void;
}

function VendorCard({ vendor, categoryIcon, expanded, onEdit }: VendorCardProps) {
  return (
    <button
      type="button"
      onClick={() => onEdit(vendor)}
      className="group w-full text-left bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex min-h-0">
        {/* Left — main info */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
              <TwEmoji emoji={categoryIcon} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-semibold text-white leading-tight truncate">
                {vendor.name}
              </h3>
              {vendor.sub && (
                <p className="text-[10px] text-white/50 mt-0.5 truncate">
                  {vendor.sub}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] text-white/40">예상</div>
              <div className="text-[13px] font-semibold text-mint tabular-nums">
                {vendor.price > 0 ? `${vendor.price.toLocaleString()}만` : "—"}
              </div>
            </div>
          </div>
          {/* In summary mode, show note inline below main info */}
          {!expanded && vendor.note && (
            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3 mt-2">{vendor.note}</p>
          )}
        </div>

        {/* Right — memo panel (expanded only) */}
        {expanded && vendor.note && (
          <div className="w-[44%] flex-shrink-0 border-l border-white/10 p-4 bg-white/[0.02]">
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-1.5">
              메모
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed line-clamp-5">
              {vendor.note}
            </p>
          </div>
        )}
        {expanded && !vendor.note && (
          <div className="w-[44%] flex-shrink-0 border-l border-white/10 p-4 bg-white/[0.02] flex items-center justify-center">
            <span className="text-[10px] text-white/20">메모 없음</span>
          </div>
        )}
      </div>
    </button>
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
          <div className="h-3 bg-white/[0.04] rounded w-full" />
          <div className="h-3 bg-white/[0.04] rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

const SAMPLE_VENDORS: Record<VendorCategory, Vendor> = {
  studio: {
    id: -1,
    name: "유디 스튜디오",
    sub: "서울 강남구",
    price: 200,
    note: "프리웨딩 + 본식 스냅 패키지. 자연광 촬영 가능.",
  },
  dress: {
    id: -1,
    name: "더 브라이드",
    sub: "서울 압구정",
    price: 150,
    note: "A라인 드레스 대여. 피팅 2회 포함.",
    target: "bride",
  },
  makeup: {
    id: -1,
    name: "청담 메이크업",
    sub: "서울 청담동",
    price: 80,
    note: "신부 + 혼주 메이크업. 리허설 1회 포함.",
  },
};

function SampleEmptyState({ category }: { category: VendorCategory }) {
  const meta = VENDOR_CATEGORIES[category];
  const sample = SAMPLE_VENDORS[category];
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div className="relative pointer-events-none select-none" aria-hidden="true">
          <div className="rounded-2xl sample-glow">
            <VendorCard
              vendor={sample}
              categoryIcon={meta.icon}
              expanded={true}
              onEdit={() => {}}
            />
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-mint/20 backdrop-blur-sm text-mint text-[10px] font-semibold tracking-wider border border-mint/30">
            예시
          </div>
        </div>
      </div>
      <div className="text-center py-4 text-sm text-white/40">
        우측 하단 + 버튼을 눌러 첫 {meta.label}을 추가해보세요
      </div>
    </div>
  );
}
