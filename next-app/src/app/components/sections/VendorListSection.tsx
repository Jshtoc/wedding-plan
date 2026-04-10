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

export default function VendorListSection({
  category,
  vendors,
  loading,
  onEdit,
}: Props) {
  const meta = VENDOR_CATEGORIES[category];
  const [sortType, setSortType] = useState<SortType>("default");
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
        <EmptyState category={category} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              categoryIcon={meta.icon}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Vendor card ────────────────────────────────────────────── */

interface VendorCardProps {
  vendor: Vendor;
  categoryIcon: string;
  onEdit: (vendor: Vendor) => void;
}

function VendorCard({ vendor, categoryIcon, onEdit }: VendorCardProps) {
  return (
    <button
      type="button"
      onClick={() => onEdit(vendor)}
      className="group text-left bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
          <TwEmoji emoji={categoryIcon} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white leading-tight truncate">
            {vendor.name}
          </h3>
          {vendor.sub && (
            <p className="text-[11px] text-white/50 mt-1 truncate">
              {vendor.sub}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] text-white/40">예상</div>
          <div className="text-sm font-semibold text-mint tabular-nums">
            {vendor.price > 0 ? `${vendor.price.toLocaleString()}만` : "—"}
          </div>
        </div>
      </div>

      {vendor.note && (
        <div className="text-[11px] text-white/50 leading-relaxed line-clamp-3">
          {vendor.note}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end text-[10px] text-white/30 group-hover:text-mint/70 transition-colors">
        <span className="inline-flex items-center gap-1">
          클릭하여 편집
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 5 L8 5 M5 2 L8 5 L5 8" />
          </svg>
        </span>
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

interface EmptyStateProps {
  category: VendorCategory;
}

function EmptyState({ category }: EmptyStateProps) {
  const meta = VENDOR_CATEGORIES[category];
  return (
    <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-3xl p-12 sm:p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mint/10 border border-mint/25 mb-5 shadow-[0_0_32px_-10px_rgba(0,255,225,0.5)]">
        <TwEmoji emoji={meta.icon} size={32} />
      </div>
      <div className="text-base font-semibold text-white mb-2">
        등록된 {meta.label}이 없습니다
      </div>
      <div className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
        우측 하단 + 버튼을 눌러 첫 {meta.label}을 추가해보세요
      </div>
    </div>
  );
}
