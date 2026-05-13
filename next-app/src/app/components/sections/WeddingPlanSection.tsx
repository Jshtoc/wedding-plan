"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { VENUES, type Venue } from "@/data/weddingPlan";
import TwEmoji from "../ui/TwEmoji";

type PlanTab = "checklist" | "venues";

/* ── 유틸 ──────────────────────────────────────────────── */
const fmtNum = (val: string): string => {
  const digits = val.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
};
const toNum = (val: string): number => {
  const n = Number((val ?? "").replace(/[^0-9]/g, ""));
  return isNaN(n) ? 0 : n;
};

/* ── 체크리스트 데이터 ──────────────────────────────────── */
interface ChecklistCategory {
  id: string;
  label: string;
  icon: string;
  items: { id: string; label: string }[];
}

export const CHECKLIST: ChecklistCategory[] = [
  {
    id: "wedding-pkg", label: "웨딩패키지 (스드메)", icon: "📸",
    items: [
      { id: "sdm-studio",           label: "스튜디오 / 스냅" },
      { id: "sdm-dress",            label: "드레스" },
      { id: "sdm-makeup",           label: "메이크업" },
      { id: "sdm-makeup-trial",     label: "메이크업시연" },
      { id: "sdm-hair-change",      label: "촬영 헤어변형" },
      { id: "sdm-raw-data",         label: "원본데이터" },
      { id: "sdm-edit-data",        label: "수정본데이터" },
      { id: "sdm-photo-helper",     label: "촬영 이모님 비용" },
      { id: "sdm-ceremony-helper",  label: "본식 이모님 비용" },
      { id: "sdm-early-start",      label: "얼리스타트 비용" },
    ],
  },
  {
    id: "hanbok", label: "한복 · 예복", icon: "👘",
    items: [
      { id: "hb-father-bride",  label: "양가 아버님 한복 (대여)" },
      { id: "hb-mother-bride",  label: "양가 어머님 한복 (대여)" },
      { id: "hb-groom-suit",    label: "신랑 정장 (맞춤)" },
      { id: "hb-father-custom", label: "양가 아버님 정장 (맞춤)" },
    ],
  },
  {
    id: "gift", label: "예물", icon: "💍",
    items: [{ id: "gift-band", label: "웨딩밴드" }],
  },
  {
    id: "ceremony", label: "결혼식", icon: "💒",
    items: [
      { id: "cer-venue",        label: "대관료" },
      { id: "cer-food",         label: "식대" },
      { id: "cer-bride-makeup", label: "혼주메이크업" },
      { id: "cer-paebaek-room", label: "폐백실 사용료" },
      { id: "cer-paebaek-host", label: "수모님 비용" },
      { id: "cer-paebaek-food", label: "폐백음식" },
      { id: "cer-bouquet",      label: "부케" },
      { id: "cer-invite-paper", label: "청첩장" },
      { id: "cer-invite-mobile",label: "모바일청첩장" },
      { id: "cer-ticket",       label: "식권" },
      { id: "cer-officiant",    label: "주례" },
      { id: "cer-emcee",        label: "사회" },
    ],
  },
  {
    id: "meet-parents", label: "상견례", icon: "🥂",
    items: [
      { id: "mp-meal", label: "식사" },
      { id: "mp-gift", label: "선물" },
    ],
  },
];

/* ── 항목별 예산 가이드 참고가격 ──────────────────────────── */
const ITEM_GUIDE: Record<string, string> = {
  "sdm-studio":          "스튜디오 250~700만원",
  "sdm-dress":           "드레스 100~500만원",
  "sdm-makeup":          "패키지 내 포함",
  "sdm-makeup-trial":    "별도 청구",
  "sdm-hair-change":     "별도 청구",
  "sdm-raw-data":        "별도 청구",
  "sdm-edit-data":       "별도 청구",
  "sdm-photo-helper":    "15~20만원",
  "sdm-ceremony-helper": "15~20만원",
  "sdm-early-start":     "10~15만원",
  "hb-father-bride":     "대여 50~70만원",
  "hb-mother-bride":     "대여 50~70만원",
  "hb-groom-suit":       "맞춤 90~300만원",
  "hb-father-custom":    "맞춤 90~300만원",
  "gift-band":           "신랑 250~1000만 / 신부 200~2000만",
  "cer-venue":           "대관료+꽃 300~2000만원",
  "cer-food":            "7~25만원/인",
  "cer-bride-makeup":    "여 22~33만원",
  "cer-paebaek-room":    "별도",
  "cer-paebaek-host":    "15~20만원",
  "cer-paebaek-food":    "20~100만원",
  "cer-bouquet":         "30~150만원",
  "cer-invite-paper":    "천~오천원/장",
  "cer-invite-mobile":   "5~30만원",
  "cer-ticket":          "",
  "cer-officiant":       "20~50만원",
  "cer-emcee":           "20~50만원",
  "mp-meal":             "인당 6만원~",
  "mp-gift":             "",
};

/* ── 스토리지 키 ────────────────────────────────────────── */
export const CHECKED_KEY      = "wwp-checklist-v1";
export const DETAILS_KEY      = "wwp-checklist-details-v1";
export const TOTAL_BUDGET_KEY = "wwp-total-budget-v1";

export interface ItemDetail { vendor: string; estimated: string; confirmed: string; }

/* ── 메인 컴포넌트 ────────────────────────────────────────── */
export default function WeddingPlanSection() {
  const [tab, setTab] = useState<PlanTab>("checklist");
  const [saved, setSaved] = useState(true);
  const doSaveRef = React.useRef<() => void>(() => {});

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const r = typeof window !== "undefined" ? localStorage.getItem(CHECKED_KEY) : null;
      return r ? new Set(JSON.parse(r) as string[]) : new Set();
    } catch { return new Set(); }
  });
  const [details, setDetails] = useState<Record<string, ItemDetail>>(() => {
    try {
      const r = typeof window !== "undefined" ? localStorage.getItem(DETAILS_KEY) : null;
      return r ? (JSON.parse(r) as Record<string, ItemDetail>) : {};
    } catch { return {}; }
  });
  const [totalBudget, setTotalBudget] = useState<string>(() => {
    try {
      return typeof window !== "undefined"
        ? (localStorage.getItem(TOTAL_BUDGET_KEY) ?? "") : "";
    } catch { return ""; }
  });

  // ── 서버 로드 (마운트 시 1회) ──────────────────────────────
  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.checked)) {
          localStorage.setItem(CHECKED_KEY, JSON.stringify(data.checked));
          setChecked(new Set(data.checked as string[]));
        }
        if (data.details && typeof data.details === "object") {
          localStorage.setItem(DETAILS_KEY, JSON.stringify(data.details));
          setDetails(data.details as Record<string, ItemDetail>);
        }
        if (typeof data.totalBudget === "string" && data.totalBudget !== "") {
          localStorage.setItem(TOTAL_BUDGET_KEY, data.totalBudget);
          setTotalBudget(data.totalBudget);
        }
      })
      .catch(() => {/* 오프라인이어도 localStorage로 동작 */});
  }, []);

  // ── localStorage 즉시 동기화 ──────────────────────────────
  useEffect(() => {
    localStorage.setItem(CHECKED_KEY, JSON.stringify([...checked]));
  }, [checked]);
  useEffect(() => {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  }, [details]);
  useEffect(() => {
    localStorage.setItem(TOTAL_BUDGET_KEY, totalBudget);
  }, [totalBudget]);

  const venueBudget = toNum(details["cer-venue"]?.estimated ?? "");
  const mealBudget  = toNum(details["cer-food"]?.estimated  ?? "");

  const tabs = [
    { id: "checklist" as PlanTab, label: "체크리스트", icon: "✅" },
    { id: "venues"    as PlanTab, label: "베뉴 리스트", icon: "🏛️" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors " +
                (tab === t.id
                  ? "bg-mint text-gray-900"
                  : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white")
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "checklist" && (
          <button
            type="button"
            onClick={() => doSaveRef.current()}
            className={
              "flex-shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-semibold transition-all " +
              (saved
                ? "bg-white/[0.05] text-white/40 border border-white/10"
                : "bg-mint text-gray-900 shadow-[0_0_18px_-4px_rgba(0,255,225,0.6)]")
            }
          >
            {saved ? (
              <><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 6L4.5 9L10.5 3"/></svg>저장됨</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2h6.5L10 3.5V10H2V2z"/><path d="M4 2v3h4V2"/><path d="M3.5 7h5"/></svg>전체 저장</>
            )}
          </button>
        )}
      </div>

      {tab === "checklist" && (
        <ChecklistTab
          saved={saved} setSaved={setSaved} doSaveRef={doSaveRef}
          checked={checked} setChecked={setChecked}
          details={details} setDetails={setDetails}
          totalBudget={totalBudget} setTotalBudget={setTotalBudget}
        />
      )}
      {tab === "venues" && <VenueListTab venueBudget={venueBudget} mealBudget={mealBudget} />}
    </div>
  );
}

/* ── 체크리스트 탭 ───────────────────────────────────────── */
function ChecklistTab({
  saved,
  setSaved,
  doSaveRef,
  checked,
  setChecked,
  details,
  setDetails,
  totalBudget,
  setTotalBudget,
}: {
  saved: boolean;
  setSaved: (v: boolean) => void;
  doSaveRef: React.MutableRefObject<() => void>;
  checked: Set<string>;
  setChecked: React.Dispatch<React.SetStateAction<Set<string>>>;
  details: Record<string, ItemDetail>;
  setDetails: React.Dispatch<React.SetStateAction<Record<string, ItemDetail>>>;
  totalBudget: string;
  setTotalBudget: React.Dispatch<React.SetStateAction<string>>;
}) {
  // ── 서버 debounce 동기화 (1.5초 뒤 저장) ─────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checked:     [...checked],
          details,
          totalBudget,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [checked, details, totalBudget]);

  /* 진행률 */
  const totalItems = CHECKLIST.reduce((a, c) => a + c.items.length, 0);
  const doneItems  = CHECKLIST.reduce((a, c) => a + c.items.filter((i) => checked.has(i.id)).length, 0);
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  /* 금액 합계 */
  const sumAll = useCallback((field: "estimated" | "confirmed") =>
    Object.values(details).reduce((s, d) => s + toNum(d[field]), 0),
  [details]);

  const totalEstimated = useMemo(() => sumAll("estimated"), [sumAll]);
  const totalConfirmed = useMemo(() => sumAll("confirmed"), [sumAll]);
  const budgetGoal     = toNum(totalBudget);

  /* 카테고리별 합계 */
  const catTotals = useMemo(() =>
    CHECKLIST.map((cat) => ({
      ...cat,
      confirmed: cat.items.reduce((s, i) => s + toNum(details[i.id]?.confirmed ?? ""), 0),
      estimated: cat.items.reduce((s, i) => s + toNum(details[i.id]?.estimated ?? ""), 0),
    })).filter((c) => c.confirmed > 0 || c.estimated > 0),
  [details]);

  const maxCat = useMemo(() =>
    Math.max(...catTotals.map((c) => Math.max(c.confirmed, c.estimated)), 1),
  [catTotals]);

  /* 저장 */
  const handleSave = useCallback(() => {
    // auto-save가 처리하므로 여기선 UI 상태만 갱신
    setSaved(true);
  }, [setSaved]);

  useEffect(() => {
    doSaveRef.current = handleSave;
  }, [handleSave, doSaveRef]);

  const toggle = (id: string) => {
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setSaved(false);
  };

  const setDetail = (id: string, field: keyof ItemDetail, raw: string) => {
    const val = field === "vendor" ? raw : fmtNum(raw);
    setDetails((prev) => ({
      ...prev,
      [id]: { ...{ vendor: "", estimated: "", confirmed: "" }, ...prev[id], [field]: val },
    }));
    setSaved(false);
  };

  const overBudget = budgetGoal > 0 && totalConfirmed > budgetGoal;
  const budgetPct  = budgetGoal > 0 ? Math.min((totalConfirmed / budgetGoal) * 100, 100) : 0;

  return (
    <div>
      {/* ── 총 목표 예산 ── */}
      <div className="mb-5">
        <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">
          총 목표 예산
        </label>
        <div className="relative w-48">
          <input
            type="text"
            inputMode="numeric"
            value={totalBudget}
            onChange={(e) => { setTotalBudget(fmtNum(e.target.value)); setSaved(false); }}
            placeholder="예: 3,000"
            className="w-full h-10 pl-3 pr-10 rounded-xl bg-white/[0.08] border border-white/20 text-sm text-white placeholder-white/25 focus:outline-none focus:border-mint/50 tabular-nums"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 pointer-events-none">만원</span>
        </div>
      </div>

      {/* ── 예산 현황 요약 ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-white/40 mb-0.5">예상 합계</div>
          <div className="text-sm font-semibold text-white tabular-nums truncate">
            {totalEstimated > 0 ? `${totalEstimated.toLocaleString()}만원` : "—"}
          </div>
        </div>
        <div className="bg-mint/[0.07] border border-mint/20 rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-mint/60 mb-0.5">확정 합계</div>
          <div className="text-sm font-semibold text-mint tabular-nums truncate">
            {totalConfirmed > 0 ? `${totalConfirmed.toLocaleString()}만원` : "—"}
          </div>
        </div>
        <div className={
          "rounded-xl px-3 py-2.5 border " +
          (overBudget ? "bg-red-500/10 border-red-400/20" : "bg-white/[0.04] border-white/10")
        }>
          <div className={`text-[10px] mb-0.5 ${overBudget ? "text-red-300/70" : "text-white/40"}`}>
            {overBudget ? "초과" : "목표 예산"}
          </div>
          <div className={`text-sm font-semibold tabular-nums truncate ${overBudget ? "text-red-300" : "text-white/70"}`}>
            {budgetGoal > 0
              ? overBudget
                ? `+${(totalConfirmed - budgetGoal).toLocaleString()}만원`
                : `${budgetGoal.toLocaleString()}만원`
              : "—"}
          </div>
        </div>
      </div>

      {/* ── 목표 대비 진행 바 ── */}
      {budgetGoal > 0 && (
        <div className="mb-4 bg-white/[0.04] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/50">목표 예산 대비 확정 금액</span>
            <span className={`text-[11px] font-semibold tabular-nums ${overBudget ? "text-red-300" : "text-mint"}`}>
              {budgetGoal > 0 ? `${Math.round((totalConfirmed / budgetGoal) * 100)}%` : "0%"}
            </span>
          </div>
          <div className="h-3 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overBudget ? "bg-red-400" : "bg-mint"}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          {budgetGoal > 0 && (
            <div className="flex justify-between mt-1.5 text-[10px] text-white/30 tabular-nums">
              <span>0원</span>
              <span>{budgetGoal > 0 && !overBudget && totalConfirmed > 0
                ? `${(budgetGoal - totalConfirmed).toLocaleString()}만원 여유`
                : overBudget
                ? `${(totalConfirmed - budgetGoal).toLocaleString()}만원 초과`
                : ""}</span>
              <span>{budgetGoal.toLocaleString()}만원</span>
            </div>
          )}
        </div>
      )}

      {/* ── 카테고리별 차트 ── */}
      {catTotals.length > 0 && (
        <div className="mb-5 bg-white/[0.04] border border-white/10 rounded-2xl p-4">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">카테고리별 금액</div>
          <div className="space-y-2.5">
            {catTotals.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <TwEmoji emoji={c.icon} size={12} />
                    <span className="text-[11px] text-white/60">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] tabular-nums">
                    {c.estimated > 0 && (
                      <span className="text-white/40">{c.estimated.toLocaleString()}만</span>
                    )}
                    {c.confirmed > 0 && (
                      <span className="text-mint font-medium">{c.confirmed.toLocaleString()}만</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
                  {/* 예상 바 */}
                  {c.estimated > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/15"
                      style={{ width: `${(c.estimated / maxCat) * 100}%` }}
                    />
                  )}
                  {/* 확정 바 */}
                  {c.confirmed > 0 && (
                    <div
                      className={
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500 " +
                        (budgetGoal > 0 && c.confirmed > (budgetGoal / CHECKLIST.length) * 2
                          ? "bg-red-400/70" : "bg-mint/80")
                      }
                      style={{ width: `${(c.confirmed / maxCat) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-white/15 inline-block"/>예상</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-mint/80 inline-block"/>확정</span>
          </div>
        </div>
      )}

      {/* ── 진행률 바 ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-mint/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-white/40 tabular-nums flex-shrink-0">
          {doneItems}/{totalItems} 완료 ({pct}%)
        </span>
      </div>

      {/* ── 표 ── */}
      <div className="overflow-x-auto rounded-2xl border border-white/25 bg-white/[0.06]">
        <table className="w-full min-w-[660px] border-collapse text-[12px] table-fixed">
          <colgroup>
            <col style={{ width: "36px" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr className="bg-white/[0.15] border-b border-white/20">
              <th className="px-2.5 py-3 text-center text-[11px] font-bold text-white/60">✓</th>
              <th className="px-3 py-3 text-left text-[11px] font-bold text-white/60">항목</th>
              <th className="px-2.5 py-3 text-center text-[11px] font-bold text-white/60">업체명</th>
              <th className="px-2.5 py-3 text-center text-[11px] font-bold text-white/40">참고가격</th>
              <th className="px-2.5 py-3 text-center text-[11px] font-bold text-white/60">예상가격</th>
              <th className="px-2.5 py-3 text-center text-[11px] font-bold text-mint/80">확정가격</th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST.map((cat) => {
              const catDone = cat.items.filter((i) => checked.has(i.id)).length;
              return (
                <React.Fragment key={cat.id}>
                  {/* 카테고리 헤더 행 */}
                  <tr className="border-t border-white/20" style={{ background: "rgba(0,255,200,0.12)" }}>
                    <td colSpan={6} className="px-3 py-2.5 border-l-4 border-mint/70">
                      <div className="flex items-center gap-2">
                        <TwEmoji emoji={cat.icon} size={13} />
                        <span className="text-[12px] font-bold text-white tracking-wide" style={{ wordBreak: "keep-all" }}>{cat.label}</span>
                        <span className="ml-auto text-[11px] text-white/60 tabular-nums font-semibold">
                          {catDone}/{cat.items.length}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* 항목 행들 */}
                  {cat.items.map((item, idx) => {
                    const isChecked = checked.has(item.id);
                    const d = details[item.id];
                    const guide = ITEM_GUIDE[item.id] ?? "";
                    const rowBg = idx % 2 === 1 ? "bg-white/[0.05]" : "bg-white/[0.02]";

                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-white/10 transition-colors hover:bg-white/[0.08] ${rowBg} ${isChecked ? "opacity-35" : ""}`}
                      >
                        {/* 체크박스 */}
                        <td className="px-2.5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            className={
                              "w-[17px] h-[17px] rounded border-2 flex items-center justify-center mx-auto transition-colors " +
                              (isChecked ? "bg-mint border-mint text-gray-900" : "border-white/40 hover:border-white/60")
                            }
                          >
                            {isChecked && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </td>

                        {/* 항목명 */}
                        <td className="px-3 py-2">
                          <span
                            className={`text-[12px] leading-tight ${isChecked ? "text-white/30 line-through" : "text-white"}`}
                            style={{ wordBreak: "keep-all" }}
                          >
                            {item.label}
                          </span>
                        </td>

                        {/* 업체명 */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={d?.vendor ?? ""}
                            onChange={(e) => setDetail(item.id, "vendor", e.target.value)}
                            placeholder="업체명 입력"
                            className="w-full h-[30px] px-2.5 rounded-lg bg-white/15 border border-white/30 text-[11px] text-white placeholder-white/35 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-colors"
                          />
                        </td>

                        {/* 참고가격 */}
                        <td className="px-2 py-2 text-center">
                          {guide && (
                            <span className="block text-[10px] text-white/55 whitespace-nowrap overflow-hidden text-ellipsis" title={guide}>{guide}</span>
                          )}
                        </td>

                        {/* 예상가격 */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={d?.estimated ?? ""}
                              onChange={(e) => setDetail(item.id, "estimated", e.target.value)}
                              placeholder="0"
                              className="w-full h-[30px] px-2 rounded-lg bg-white/15 border border-white/30 text-[11px] text-white text-right placeholder-white/35 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-colors tabular-nums"
                            />
                            <span className="text-[10px] text-white/50 flex-shrink-0">만</span>
                          </div>
                        </td>

                        {/* 확정가격 */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={d?.confirmed ?? ""}
                              onChange={(e) => setDetail(item.id, "confirmed", e.target.value)}
                              placeholder="0"
                              className="w-full h-[30px] px-2 rounded-lg bg-mint/20 border border-mint/40 text-[11px] text-mint text-right placeholder-mint/40 focus:outline-none focus:border-mint/70 focus:bg-mint/25 transition-colors tabular-nums"
                            />
                            <span className="text-[10px] text-mint/60 flex-shrink-0">만</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── 베뉴 리스트 탭 ───────────────────────────────────── */

const HALL_TYPES = ["일반", "채플", "컨벤션", "호텔", "하우스", "야외", "소규모", "한옥/전통"];
const MOODS = ["밝음", "어두움", "야외"];

/** 요금 문자열에서 최솟값(만원 단위) 추출 */
function parseMinFee(fee: string): number | null {
  if (!fee || fee === "협의" || fee === "별도" || fee === "-") return null;
  if (fee === "무료" || fee === "포함") return 0;
  const m = fee.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function VenueListTab({ venueBudget, mealBudget }: { venueBudget: number; mealBudget: number }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [showCount, setShowCount] = useState(30);

  const hasFilter = venueBudget > 0 || mealBudget > 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = VENUES.filter((v) => {
      if (q &&
        !v.name.toLowerCase().includes(q) &&
        !v.station.toLowerCase().includes(q) &&
        !v.features.toLowerCase().includes(q) &&
        !v.region.toLowerCase().includes(q)
      ) return false;
      if (typeFilter && !v.hall_type.includes(typeFilter)) return false;
      if (moodFilter && !v.mood.includes(moodFilter)) return false;
      return true;
    });

    if (!hasFilter) return base.map((v) => ({ v, score: 0, vMatch: false, mMatch: false }));

    return base
      .map((v) => {
        const vFee  = parseMinFee(v.venue_fee);
        const mFee  = parseMinFee(v.meal_fee);
        const vMatch = venueBudget > 0 && vFee !== null && vFee <= venueBudget;
        const mMatch = mealBudget  > 0 && mFee !== null && mFee <= mealBudget;
        const score = (vMatch ? 2 : 0) + (mMatch ? 1 : 0);
        return { v, score, vMatch, mMatch };
      })
      .sort((a, b) => b.score - a.score);
  }, [search, typeFilter, moodFilter, venueBudget, mealBudget, hasFilter]);

  const shown = filtered.slice(0, showCount);

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowCount(30); }}
          placeholder="업체명 · 역 · 특징 검색"
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-mint/40"
        />
      </div>
      <div className="mb-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {HALL_TYPES.map((t) => (
            <button key={t} type="button"
              onClick={() => { setTypeFilter(typeFilter === t ? "" : t); setShowCount(30); }}
              className={"px-3 py-1 rounded-full text-[11px] font-medium transition-colors " + (typeFilter === t ? "bg-mint text-gray-900" : "bg-white/[0.04] text-white/50 border border-white/10 hover:text-white")}
            >{t}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {MOODS.map((m) => (
            <button key={m} type="button"
              onClick={() => { setMoodFilter(moodFilter === m ? "" : m); setShowCount(30); }}
              className={"px-3 py-1 rounded-full text-[11px] font-medium transition-colors " + (moodFilter === m ? "bg-violet-400/80 text-white" : "bg-white/[0.04] text-white/50 border border-white/10 hover:text-white")}
            >{m}</button>
          ))}
          {(search || typeFilter || moodFilter) && (
            <button type="button" onClick={() => { setSearch(""); setTypeFilter(""); setMoodFilter(""); }}
              className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] text-white/40 border border-white/10 hover:text-white"
            >초기화</button>
          )}
        </div>
      </div>
      {hasFilter && (
        <div className="flex items-center gap-2 mb-3 text-[11px]">
          <span className="text-white/40">예산 기준:</span>
          {venueBudget > 0 && <span className="text-mint/80">대관료 {venueBudget.toLocaleString()}만원 이하</span>}
          {mealBudget  > 0 && <span className="text-violet-300/80">식대 {mealBudget.toLocaleString()}만원/인 이하</span>}
        </div>
      )}
      <div className="text-[11px] text-white/30 mb-3">총 {filtered.length}개 베뉴</div>
      <div className="space-y-2">
        {shown.map(({ v, score, vMatch, mMatch }, idx) => (
          <VenueCard
            key={`${v.name}-${v.hall_type}-${idx}`}
            venue={v}
            vMatch={hasFilter ? (vMatch ?? false) : undefined}
            mMatch={hasFilter ? (mMatch ?? false) : undefined}
            score={hasFilter ? score : undefined}
          />
        ))}
      </div>
      {filtered.length > showCount && (
        <button type="button" onClick={() => setShowCount((n) => n + 30)}
          className="mt-4 w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors"
        >더 보기 ({filtered.length - showCount}개 남음)</button>
      )}
      {filtered.length === 0 && <div className="text-center py-12 text-white/30 text-sm">검색 결과가 없습니다</div>}
    </div>
  );
}

function VenueCard({ venue: v, vMatch, mMatch, score }: {
  venue: Venue;
  vMatch?: boolean;
  mMatch?: boolean;
  score?: number;
}) {
  const moodColor = v.mood.includes("밝") ? "text-amber-300" : v.mood.includes("야외") ? "text-emerald-300" : "text-white/50";
  const bothMatch = vMatch && mMatch;
  const borderClass = bothMatch
    ? "border-mint/50 bg-mint/[0.04]"
    : (vMatch || mMatch)
    ? "border-white/20 bg-white/[0.04]"
    : "border-white/10 bg-white/[0.02]";

  return (
    <div className={`border rounded-2xl p-4 hover:brightness-110 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h3 className="text-[13px] font-semibold text-white leading-tight">{v.name}</h3>
          {bothMatch && (
            <span className="text-[10px] font-semibold text-gray-900 bg-mint px-1.5 py-0.5 rounded-full">✓ 예산 적합</span>
          )}
          {!bothMatch && vMatch && (
            <span className="text-[10px] font-medium text-mint bg-mint/15 border border-mint/30 px-1.5 py-0.5 rounded-full">대관 가능</span>
          )}
          {!bothMatch && mMatch && (
            <span className="text-[10px] font-medium text-violet-300 bg-violet-400/10 border border-violet-400/25 px-1.5 py-0.5 rounded-full">식대 가능</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {v.mood && <span className={`text-[10px] font-medium ${moodColor}`}>{v.mood}</span>}
        </div>
      </div>
      {v.hall_type && <span className="text-[10px] text-mint/70 mb-2 block">{v.hall_type}</span>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/50 mb-2">
        {v.guests    && <span><span className="text-white/30">보증 </span>{v.guests}명</span>}
        {v.venue_fee && (
          <span>
            <span className="text-white/30">대관 </span>
            <span className={vMatch ? "text-mint font-medium" : "text-white/70"}>{v.venue_fee}</span>
          </span>
        )}
        {v.flowers && v.flowers !== "포함" && <span><span className="text-white/30">꽃 </span>{v.flowers}</span>}
        {v.flowers === "포함" && <span className="text-emerald-400/70">꽃장식 포함</span>}
        {v.meal_fee  && (
          <span>
            <span className="text-white/30">식대 </span>
            <span className={mMatch ? "text-violet-300 font-medium" : ""}>{v.meal_fee}</span>
          </span>
        )}
        {v.parking   && <span><span className="text-white/30">주차 </span>{v.parking}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {v.features && <span className="text-[10px] text-white/40 flex-1 min-w-0 truncate">{v.features}</span>}
        {v.station  && <span className="text-[10px] text-mint/60 flex-shrink-0 bg-mint/10 px-2 py-0.5 rounded-full">🚇 {v.station}</span>}
      </div>
    </div>
  );
}
