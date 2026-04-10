"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  WeddingHall,
  TRANSPORT_META,
  computePriceLevel,
} from "@/data/halls";
import {
  BudgetItem,
  isCustomCategory,
  withDefaults,
} from "@/data/budgets";
import { WeddingEvent } from "@/data/events";
import {
  DressTarget,
  Vendor,
  VENDOR_CATEGORIES,
  VendorCategory,
} from "@/data/vendors";
import { supabase } from "@/lib/supabase";
import HallFormModal from "./HallFormModal";
import EventFormModal from "./EventFormModal";
import VendorFormModal from "./VendorFormModal";
import VendorListSection from "./sections/VendorListSection";
import TwEmoji from "./ui/TwEmoji";
import OverviewSection from "./sections/OverviewSection";
import BudgetSection from "./sections/BudgetSection";

/**
 * Active section id. Fixed ids are the 7 built-in menu items; any
 * other string is a custom budget category (`custom:<rand>`).
 */
type FixedSection =
  | "overview"
  | "halls"
  | "studios"
  | "dresses"
  | "makeup"
  | "budget"
  | "routes";
type Section = FixedSection | string;
type SortType = "default" | "price" | "guests" | "parking";

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
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [studios, setStudios] = useState<Vendor[]>([]);
  const [dresses, setDresses] = useState<Vendor[]>([]);
  const [makeups, setMakeups] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState<WeddingHall | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [vendorModal, setVendorModal] = useState<{
    category: VendorCategory;
    editing: Vendor | null;
    defaultTarget?: DressTarget;
  } | null>(null);
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

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEvents(data);
      }
    } catch {
      // silent — events are optional; default to empty
    }
  }, []);

  // Fetch all three vendor categories in parallel. Used on mount and
  // whenever realtime signals a change.
  const fetchVendors = useCallback(async () => {
    const load = async (
      cat: VendorCategory,
      setter: (v: Vendor[]) => void
    ) => {
      try {
        const res = await fetch(`/api/vendors/${cat}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setter(data);
      } catch {
        // silent — vendor lists are optional
      }
    };
    await Promise.all([
      load("studio", setStudios),
      load("dress", setDresses),
      load("makeup", setMakeups),
    ]);
    setVendorsLoading(false);
  }, []);

  useEffect(() => {
    fetchHalls();
    fetchBudgets();
    fetchEvents();
    fetchVendors();
  }, [fetchHalls, fetchBudgets, fetchEvents, fetchVendors]);

  // Custom budget items that should appear as sidebar tabs. Only
  // items with a non-empty label get a tab — empty placeholders (rows
  // the user added but never named) are hidden.
  const customSections = useMemo(
    () =>
      budgets.filter(
        (b) => isCustomCategory(b.category) && (b.label ?? "").trim()
      ),
    [budgets]
  );

  // If the active section refers to a custom item that no longer
  // exists (deleted by this user or the other), snap back to overview.
  useEffect(() => {
    if (isCustomCategory(active)) {
      const exists = customSections.some((c) => c.category === active);
      if (!exists) setActive("overview");
    }
  }, [customSections, active]);

  // Realtime sync — when the other user updates halls / budgets /
  // events, re-fetch so both sessions stay in sync automatically.
  // Supabase uses Postgres logical replication; all three tables
  // must be in the supabase_realtime publication (see
  // supabase/realtime.sql and supabase/events.sql).
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          fetchEvents();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "studios" },
        () => {
          fetchVendors();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dresses" },
        () => {
          fetchVendors();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "makeups" },
        () => {
          fetchVendors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHalls, fetchBudgets, fetchEvents, fetchVendors]);

  const sortedHalls = useMemo(() => {
    const sorted = [...halls];
    switch (sortType) {
      case "price":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "guests":
        sorted.sort((a, b) => a.guests - b.guests);
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

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };
  const handleEditEvent = (ev: WeddingEvent) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  // Vendor CRUD — one set of handlers drives studio/dress/makeup.
  const handleVendorAdd = (
    category: VendorCategory,
    defaultTarget?: DressTarget
  ) => {
    setVendorModal({ category, editing: null, defaultTarget });
  };
  const handleVendorEdit = (category: VendorCategory, v: Vendor) => {
    setVendorModal({ category, editing: v });
  };

  // Map the active sidebar section id to a vendor category (or null
  // when the active section isn't a vendor list).
  const activeVendorCategory: VendorCategory | null =
    active === "studios"
      ? "studio"
      : active === "dresses"
        ? "dress"
        : active === "makeup"
          ? "makeup"
          : null;

  const handleSelectSection = (id: Section) => {
    setActive(id);
    setSidebarOpen(false);
  };

  // Resolve the currently-active section's metadata. For fixed ids we
  // look it up in SECTIONS; for custom ids we synthesize metadata
  // from the matching budget row.
  const activeSection: SectionDef = useMemo(() => {
    const fixed = SECTIONS.find((s) => s.id === active);
    if (fixed) return fixed;
    const custom = customSections.find((c) => c.category === active);
    if (custom) {
      return {
        id: custom.category,
        label: custom.label || "항목",
        icon: custom.icon || "📌",
        subtitle: "사용자 추가 항목",
      };
    }
    return SECTIONS[0];
  }, [active, customSections]);

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

          {/* Custom budget items — dynamic tabs derived from the
              user's added budget categories. */}
          {customSections.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-4 text-[9px] font-semibold text-white/30 uppercase tracking-[0.3em]">
                My Items
              </div>
              {customSections.map((c) => {
                const isActive = c.category === active;
                return (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => handleSelectSection(c.category)}
                    className={
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all " +
                      (isActive
                        ? "bg-mint/15 text-mint border border-mint/30 shadow-[0_0_24px_-8px_rgba(0,255,225,0.4)]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent")
                    }
                  >
                    <TwEmoji emoji={c.icon || "📌"} size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight truncate">
                        {c.label}
                      </div>
                      <div
                        className={
                          "text-[10px] mt-0.5 truncate tabular-nums " +
                          (isActive ? "text-mint/60" : "text-white/30")
                        }
                      >
                        {c.budget > 0
                          ? `${c.budget.toLocaleString()}만원`
                          : "예산 미설정"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
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
              studiosCount={studios.length}
              dressesCount={dresses.length}
              makeupsCount={makeups.length}
              budgets={budgets}
              events={events}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
            />
          )}
          {active === "halls" && (
            <HallsSection
              halls={sortedHalls}
              budgets={budgets}
              loading={loading}
              fetchError={fetchError}
              sortType={sortType}
              onSortChange={setSortType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {active === "studios" && (
            <VendorListSection
              category="studio"
              vendors={studios}
              loading={vendorsLoading}
              onEdit={(v) => handleVendorEdit("studio", v)}
            />
          )}
          {active === "dresses" && (
            <VendorListSection
              category="dress"
              vendors={dresses}
              loading={vendorsLoading}
              onEdit={(v) => handleVendorEdit("dress", v)}
            />
          )}
          {active === "makeup" && (
            <VendorListSection
              category="makeup"
              vendors={makeups}
              loading={vendorsLoading}
              onEdit={(v) => handleVendorEdit("makeup", v)}
            />
          )}
          {active === "budget" && (
            <BudgetSection initial={budgets} onSaved={setBudgets} />
          )}
          {active === "routes" && <RoutesStubSection />}
          {isCustomCategory(active) &&
            (() => {
              const item = customSections.find((c) => c.category === active);
              if (!item) return null;
              return <CustomSection item={item} />;
            })()}
        </main>
      </div>

      {/* ── FAB (list sections: halls + vendors) ─────────────── */}
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
      {activeVendorCategory && (
        <button
          type="button"
          onClick={() => handleVendorAdd(activeVendorCategory)}
          aria-label={`${VENDOR_CATEGORIES[activeVendorCategory].label} 추가`}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-mint text-gray-900 text-2xl font-light flex items-center justify-center shadow-[0_12px_40px_-8px_rgba(0,255,225,0.6)] active:scale-95 transition-transform z-30"
        >
          +
        </button>
      )}

      {/* ── Modals ───────────────────────── */}
      {showModal && (
        <HallFormModal
          hall={editingHall}
          budgets={budgets}
          onClose={() => setShowModal(false)}
          onSaved={fetchHalls}
        />
      )}
      {showEventModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setShowEventModal(false)}
          onSaved={fetchEvents}
        />
      )}
      {vendorModal && (
        <VendorFormModal
          category={vendorModal.category}
          vendor={vendorModal.editing}
          defaultTarget={vendorModal.defaultTarget}
          onClose={() => setVendorModal(null)}
          onSaved={fetchVendors}
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
  budgets: BudgetItem[];
  loading: boolean;
  fetchError: string | null;
  sortType: SortType;
  onSortChange: (t: SortType) => void;
  onEdit: (h: WeddingHall) => void;
  onDelete: (id: number) => void;
}

function HallsSection({
  halls,
  budgets,
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
    { type: "guests", label: "보증인원순" },
    { type: "parking", label: "주차 많은순" },
  ];

  const hallBudget = budgets.find((b) => b.category === "hall")?.budget ?? 0;

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
            hallBudget={hallBudget}
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
  hallBudget: number;
  onEdit: (h: WeddingHall) => void;
  onDelete: (id: number) => void;
}

function DarkHallCard({
  hall,
  hallBudget,
  onEdit,
  onDelete,
}: DarkHallCardProps) {
  const priceLevel = computePriceLevel(hall.price, hallBudget);

  const priceColor =
    priceLevel === "ok"
      ? "text-emerald-300"
      : priceLevel === "warn"
        ? "text-amber-300"
        : priceLevel === "over"
          ? "text-red-300"
          : "text-white";

  const dotColor =
    priceLevel === "ok"
      ? "bg-emerald-400"
      : priceLevel === "warn"
        ? "bg-amber-400"
        : priceLevel === "over"
          ? "bg-red-400"
          : "bg-white/20";

  return (
    <div className="group bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-colors hover:border-white/20">
      {/* Header row — name + price */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white leading-tight truncate">
            {hall.name}
          </h3>
          {hall.sub && (
            <p className="text-[11px] text-white/50 mt-1 truncate">
              {hall.sub}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          {priceLevel && (
            <span
              className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}
              aria-hidden="true"
            />
          )}
          <div>
            <div className="text-[10px] text-white/40">예상</div>
            <div className={`text-sm font-semibold tabular-nums ${priceColor}`}>
              {hall.price > 0 ? `${hall.price.toLocaleString()}만` : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Info strip — guests / parking */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/60 mb-3">
        {hall.guests > 0 && (
          <div className="flex items-center gap-1.5">
            <TwEmoji emoji="👥" size={12} />
            <span className="tabular-nums">
              보증 {hall.guests.toLocaleString()}명
            </span>
          </div>
        )}
        {hall.parking > 0 && (
          <div className="flex items-center gap-1.5">
            <TwEmoji emoji="🅿️" size={12} />
            <span className="tabular-nums">
              주차 {hall.parking.toLocaleString()}대
            </span>
          </div>
        )}
      </div>

      {/* Transport pills */}
      {hall.transport.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TRANSPORT_META.filter((t) => hall.transport.includes(t.id)).map(
            (t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-mint/10 border border-mint/20 text-mint/90"
              >
                <TwEmoji emoji={t.icon} size={11} />
                {t.label}
              </span>
            )
          )}
        </div>
      )}

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
  );
}

/* ── Stub sections ────────────────────────── */

function RoutesStubSection() {
  return (
    <EmptyState
      icon="🗺️"
      title="동선 계산 초안"
      description="선택한 웨딩홀 / 스튜디오 / 드레스 샵 / 메이크업 샵을 기반으로 하루 투어 최적 경로를 계산합니다. 곧 구현 예정."
    />
  );
}

interface CustomSectionProps {
  item: BudgetItem;
}

/**
 * Placeholder content for a user-added budget category. For now it
 * just shows the item's budget and an empty-state hint — later this
 * is where per-category lists / CRUD UI can live.
 */
function CustomSection({ item }: CustomSectionProps) {
  const label = item.label || "항목";
  return (
    <EmptyState
      icon={item.icon || "📌"}
      title={`${label} 섹션`}
      description={
        item.budget > 0
          ? `${label} 관련 정보를 등록할 수 있는 공간입니다. 현재 ${item.budget.toLocaleString()}만원 배정됨.`
          : `${label} 관련 정보를 등록할 수 있는 공간입니다. 결혼 예산 → ${label}에서 금액을 배정해보세요.`
      }
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
