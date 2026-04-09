"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { WeddingHall } from "@/data/halls";
import { BudgetItem, withDefaults } from "@/data/budgets";
import { supabase } from "@/lib/supabase";
import HallFormModal from "./HallFormModal";
import TwEmoji from "./ui/TwEmoji";
import OverviewSection from "./sections/OverviewSection";
import BudgetSection from "./sections/BudgetSection";

type Section =
  | "overview"
  | "halls"
  | "studios"
  | "dresses"
  | "makeup"
  | "budget"
  | "routes";
type SortType = "default" | "price" | "ktx" | "parking";

interface SectionDef {
  id: Section;
  label: string;
  icon: string;
  subtitle: string;
}

const SECTIONS: SectionDef[] = [
  { id: "overview", label: "대시보드", icon: "📊", subtitle: "전체 진행 현황 & 일정" },
  { id: "halls", label: "웨딩홀", icon: "💒", subtitle: "예식장 비교 및 견적" },
  { id: "studios", label: "스튜디오", icon: "📸", subtitle: "촬영 스튜디오 리스트" },
  { id: "dresses", label: "드레스", icon: "👰", subtitle: "신랑 · 신부 의상" },
  { id: "makeup", label: "메이크업", icon: "💄", subtitle: "메이크업 샵 리스트" },
  { id: "budget", label: "결혼 예산", icon: "💰", subtitle: "항목별 예산 배분 및 관리" },
  { id: "routes", label: "동선", icon: "🗺️", subtitle: "하루 투어 동선 계산" },
];

export default function WeddingApp() {
  const [active, setActive] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [halls, setHalls] = useState<WeddingHall[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>(() => withDefaults([]));
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState<WeddingHall | null>(null);
  const [sortType, setSortType] = useState<SortType>("default");

  const fetchHalls = useCallback(async () => {
    try {
      const res = await fetch("/api/halls");
      const data = await res.json();
      if (!res.ok) {
        const message =
          (data && typeof data === "object" && "error" in data
            ? String(data.error)
            : null) || `요청 실패 (HTTP ${res.status})`;
        setFetchError(message);
        setHalls([]);
      } else if (!Array.isArray(data)) {
        setFetchError("서버가 예상치 못한 응답을 반환했습니다.");
        setHalls([]);
      } else {
        setFetchError(null);
        setHalls(data);
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "네트워크 오류");
      setHalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch("/api/budgets");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setBudgets(withDefaults(data));
      }
    } catch {
      // silent — budgets are optional; default to zeros
    }
  }, []);

  useEffect(() => {
    fetchHalls();
    fetchBudgets();
  }, [fetchHalls, fetchBudgets]);

  // Realtime sync — when the other user updates halls or budgets,
  // re-fetch so both sessions stay in sync automatically. Supabase uses
  // Postgres logical replication; the supabase_realtime publication
  // must include these tables (see supabase/realtime.sql).
  useEffect(() => {
    const channel = supabase
      .channel("wwp-shared")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "halls" },
        () => {
          fetchHalls();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets" },
        () => {
          fetchBudgets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHalls, fetchBudgets]);

  const sortedHalls = useMemo(() => {
    const sorted = [...halls];
    switch (sortType) {
      case "price":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "ktx":
        sorted.sort((a, b) => b.ktx - a.ktx);
        break;
      case "parking":
        sorted.sort((a, b) => b.parking - a.parking);
        break;
      default:
        sorted.sort((a, b) => a.price - b.price);
        break;
    }
    return sorted;
  }, [halls, sortType]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleAdd = () => {
    setEditingHall(null);
    setShowModal(true);
  };

  const handleEdit = (hall: WeddingHall) => {
    setEditingHall(hall);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/halls/${id}`, { method: "DELETE" });
    fetchHalls();
  };

  const handleSelectSection = (id: Section) => {
    setActive(id);
    setSidebarOpen(false);
  };

  const activeSection = SECTIONS.find((s) => s.id === active)!;

  return (
    <div className="min-h-[100dvh] bg-[#020806] text-white">
      {/* ── Sidebar (fixed; slide in/out on mobile) ─── */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col " +
          "bg-[#020806] border-r border-white/10 " +
          "transition-transform duration-300 ease-out " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full") +
          " md:translate-x-0"
        }
      >
        {/* Mobile-only close button */}
        <div className="md:hidden flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="메뉴 닫기"
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M6 18L18 6"
              />
            </svg>
          </button>
        </div>

        {/* Top: sidebar eyebrow */}
        <div className="px-6 pt-6 md:pt-8 pb-4">
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.3em] uppercase">
            Menu
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          {SECTIONS.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSection(s.id)}
                className={
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all " +
                  (isActive
                    ? "bg-mint/15 text-mint border border-mint/30 shadow-[0_0_24px_-8px_rgba(0,255,225,0.4)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent")
                }
              >
                <TwEmoji emoji={s.icon} size={18} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight">
                    {s.label}
                  </div>
                  <div
                    className={
                      "text-[10px] mt-0.5 truncate " +
                      (isActive ? "text-mint/60" : "text-white/30")
                    }
                  >
                    {s.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer: logo + logout */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wwp-symbol.svg"
              alt="WWP"
              width={40}
              height={40}
              className="flex-shrink-0 rounded-xl shadow-[0_0_20px_-6px_rgba(0,255,225,0.4)]"
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">
                우리들의 웨딩 플랜
              </div>
              <div className="text-[10px] text-white/40 tracking-[0.15em] uppercase mt-0.5">
                WWP Dashboard
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-medium text-white/60 hover:text-white bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── Mobile backdrop ──────────────── */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="메뉴 닫기"
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* ── Main column (desktop left-padded for sidebar) ── */}
      <div className="md:pl-72 min-h-[100dvh] flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 p-0 text-left border-b border-white/10 bg-[#020806]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
              className="-ml-2 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wwp-symbol.svg"
              alt="WWP"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold text-white tracking-wide">
              WWP
            </span>
          </div>
        </header>

        {/* Section header */}
        <div className="w-full max-w-5xl mx-auto px-5 md:px-10 pt-8 md:pt-14 pb-6">
          <div className="text-[11px] font-semibold text-mint/70 tracking-[0.25em] uppercase mb-2">
            {activeSection.subtitle}
          </div>
          <h1 className="text-[26px] sm:text-3xl font-semibold tracking-tight">
            {activeSection.label}
          </h1>
        </div>

        {/* Section content */}
        <main className="w-full max-w-5xl mx-auto px-5 md:px-10 pb-24 flex-1">
          {active === "overview" && (
            <OverviewSection
              hallsCount={halls.length}
              budgets={budgets}
            />
          )}
          {active === "halls" && (
            <HallsSection
              halls={sortedHalls}
              loading={loading}
              fetchError={fetchError}
              sortType={sortType}
              onSortChange={setSortType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {active === "studios" && <StubSection icon="📸" name="스튜디오" />}
          {active === "dresses" && <DressesStubSection />}
          {active === "makeup" && <StubSection icon="💄" name="메이크업" />}
          {active === "budget" && (
            <BudgetSection initial={budgets} onSaved={setBudgets} />
          )}
          {active === "routes" && <RoutesStubSection />}
        </main>
      </div>

      {/* ── FAB (halls only) ─────────────── */}
      {active === "halls" && (
        <button
          type="button"
          onClick={handleAdd}
          aria-label="웨딩홀 추가"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-mint text-gray-900 text-2xl font-light flex items-center justify-center shadow-[0_12px_40px_-8px_rgba(0,255,225,0.6)] active:scale-95 transition-transform z-30"
        >
          +
        </button>
      )}

      {/* ── Modal ────────────────────────── */}
      {showModal && (
        <HallFormModal
          hall={editingHall}
          onClose={() => setShowModal(false)}
          onSaved={fetchHalls}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sections
   ───────────────────────────────────────────── */

interface HallsSectionProps {
  halls: WeddingHall[];
  loading: boolean;
  fetchError: string | null;
  sortType: SortType;
  onSortChange: (t: SortType) => void;
  onEdit: (h: WeddingHall) => void;
  onDelete: (id: number) => void;
}

function HallsSection({
  halls,
  loading,
  fetchError,
  sortType,
  onSortChange,
  onEdit,
  onDelete,
}: HallsSectionProps) {
  const sortOptions: { type: SortType; label: string }[] = [
    { type: "default", label: "기본" },
    { type: "price", label: "가격 낮은순" },
    { type: "ktx", label: "KTX 접근성순" },
    { type: "parking", label: "주차 많은순" },
  ];

  if (loading) {
    return <SkeletonGrid />;
  }

  if (fetchError) {
    return (
      <div className="bg-red-500/10 border border-red-400/20 text-red-200 rounded-2xl p-5 text-sm">
        <div className="font-medium mb-1">데이터를 불러오지 못했습니다</div>
        <div className="text-xs text-red-200/70">{fetchError}</div>
      </div>
    );
  }

  if (halls.length === 0) {
    return (
      <EmptyState
        icon="💒"
        title="등록된 웨딩홀이 없습니다"
        description="우측 하단 + 버튼을 눌러 첫 번째 웨딩홀을 추가해보세요"
      />
    );
  }

  return (
    <div>
      {/* Sort bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
        {sortOptions.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSortChange(opt.type)}
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

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {halls.map((hall) => (
          <DarkHallCard
            key={hall.id}
            hall={hall}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

interface DarkHallCardProps {
  hall: WeddingHall;
  onEdit: (h: WeddingHall) => void;
  onDelete: (id: number) => void;
}

function DarkHallCard({ hall, onEdit, onDelete }: DarkHallCardProps) {
  const [imgError, setImgError] = useState(false);

  const priceColor =
    hall.priceLevel === "ok"
      ? "text-mint"
      : hall.priceLevel === "warn"
        ? "text-amber-300"
        : "text-red-300";

  return (
    <div className="group bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-white/20">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-black/30">
        {hall.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hall.image}
            alt={hall.imageAlt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TwEmoji emoji={hall.imageFallback} size={48} />
          </div>
        )}
        {hall.isBest && hall.bestLabel && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-mint text-gray-900 text-[10px] font-semibold tracking-wide">
            {hall.bestLabel}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight">
              {hall.name}
            </h3>
            <p className="text-[11px] text-white/50 mt-1 truncate">
              {hall.sub}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] text-white/40">{hall.priceLabel}</div>
            <div className={`text-sm font-semibold ${priceColor}`}>
              {hall.priceText}
            </div>
          </div>
        </div>

        {/* Badges */}
        {hall.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hall.badges.slice(0, 3).map((b, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70"
              >
                {b.text}
              </span>
            ))}
          </div>
        )}

        {/* KTX row */}
        <div className="flex items-center gap-2 text-[11px] text-white/60 mb-3">
          <TwEmoji emoji={hall.ktxWarn ? "🚇" : "🚄"} size={12} />
          <span className="truncate">{hall.ktxText}</span>
        </div>

        {/* Note */}
        {hall.note && (
          <div className="text-[11px] text-white/50 leading-relaxed line-clamp-3 mb-4">
            {hall.note}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(hall)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
          >
            <TwEmoji emoji="✏️" size={12} /> 수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(hall.id)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-500/10 border border-red-400/20 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <TwEmoji emoji="🗑️" size={12} /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stub sections ────────────────────────── */

interface StubSectionProps {
  icon: string;
  name: string;
}

function StubSection({ icon, name }: StubSectionProps) {
  return (
    <EmptyState
      icon={icon}
      title={`${name} 섹션 초안`}
      description={`${name} 데이터 모델과 UI를 설계 중입니다. 곧 등록/비교/정렬 기능을 제공할 예정이에요.`}
    />
  );
}

function DressesStubSection() {
  const [subTab, setSubTab] = useState<"groom" | "bride">("bride");

  return (
    <div>
      <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setSubTab("bride")}
          className={
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors " +
            (subTab === "bride"
              ? "bg-mint text-gray-900"
              : "text-white/60 hover:text-white")
          }
        >
          <TwEmoji emoji="👰" size={14} /> 신부
        </button>
        <button
          type="button"
          onClick={() => setSubTab("groom")}
          className={
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors " +
            (subTab === "groom"
              ? "bg-mint text-gray-900"
              : "text-white/60 hover:text-white")
          }
        >
          <TwEmoji emoji="🤵" size={14} /> 신랑
        </button>
      </div>

      <EmptyState
        icon="👰"
        title={`${subTab === "bride" ? "신부" : "신랑"} 드레스 섹션 초안`}
        description="드레스 샵, 대여/맞춤 구분, 피팅 일정 등 데이터 모델을 설계 중이에요."
      />
    </div>
  );
}

function RoutesStubSection() {
  return (
    <EmptyState
      icon="🗺️"
      title="동선 계산 초안"
      description="선택한 웨딩홀 / 스튜디오 / 드레스 샵 / 메이크업 샵을 기반으로 하루 투어 최적 경로를 계산합니다. 곧 구현 예정."
    />
  );
}

/* ── Shared UI ────────────────────────────── */

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-3xl p-12 sm:p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mint/10 border border-mint/25 mb-5 shadow-[0_0_32px_-10px_rgba(0,255,225,0.5)]">
        <TwEmoji emoji={icon} size={32} />
      </div>
      <div className="text-base font-semibold text-white mb-2">{title}</div>
      <div className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
        {description}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[16/10] bg-white/[0.03]" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-white/[0.06] rounded w-2/3" />
            <div className="h-3 bg-white/[0.04] rounded w-1/2" />
            <div className="h-3 bg-white/[0.04] rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
