"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BudgetItem,
  BUDGET_CATEGORIES,
  BudgetCategory,
  totalBudget,
  withDefaults,
} from "@/data/budgets";
import TwEmoji from "../ui/TwEmoji";
import BudgetDonutChart from "../ui/BudgetDonutChart";

interface Props {
  /** Initial budgets fetched by the parent. Component owns its own
   *  draft state so edits don't trigger re-fetches. */
  initial: BudgetItem[];
  /** Called after a successful save so the parent can refresh its
   *  cached copy (and the dashboard donut can update). */
  onSaved: (items: BudgetItem[]) => void;
}

export default function BudgetSection({ initial, onSaved }: Props) {
  const [draft, setDraft] = useState<BudgetItem[]>(() => withDefaults(initial));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [remoteUpdateCount, setRemoteUpdateCount] = useState(0);

  // `lastBaseline` tracks the most recent server values we synced with.
  // When a realtime update arrives via the parent's `initial` prop, we
  // merge per-category: if the local draft value equals the OLD baseline
  // (i.e. the user hasn't edited it), adopt the new server value.
  // Otherwise keep the user's in-progress edit so collaborative edits
  // don't clobber each other.
  const lastBaseline = useRef<BudgetItem[]>(withDefaults(initial));

  useEffect(() => {
    const newBaseline = withDefaults(initial);
    let changed = false;
    setDraft((prev) => {
      const merged = prev.map((p, i) => {
        const oldVal = lastBaseline.current[i]?.budget ?? 0;
        const userEdited = p.budget !== oldVal;
        if (userEdited) {
          // Preserve user's local edit
          return p;
        }
        if (p.budget !== newBaseline[i].budget) {
          changed = true;
        }
        return newBaseline[i];
      });
      return merged;
    });
    lastBaseline.current = newBaseline;
    if (changed) {
      setRemoteUpdateCount((c) => c + 1);
    }
  }, [initial]);

  const total = useMemo(() => totalBudget(draft), [draft]);

  const isDirty = useMemo(() => {
    return draft.some(
      (d, i) => d.budget !== (lastBaseline.current[i]?.budget ?? 0)
    );
  }, [draft]);

  const setBudget = (cat: BudgetCategory, value: number) => {
    setDraft((prev) =>
      prev.map((p) =>
        p.category === cat
          ? { ...p, budget: Number.isFinite(value) ? Math.max(0, value) : 0 }
          : p
      )
    );
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "저장에 실패했습니다.");
        return;
      }
      // Our save becomes the new synced baseline. Clear the "remote
      // update" notice too since we've reconciled.
      lastBaseline.current = draft.map((d) => ({ ...d }));
      setSavedAt(new Date());
      setRemoteUpdateCount(0);
      onSaved(draft);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Restore to the most recent server baseline (which may have been
    // updated by another user since this edit started).
    setDraft(lastBaseline.current.map((b) => ({ ...b })));
    setSaveError(null);
    setSavedAt(null);
    setRemoteUpdateCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Donut chart card */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
            Budget Allocation
          </div>
          <div className="text-lg font-semibold text-white tracking-tight">
            예산 배분 현황
          </div>
        </div>
        <BudgetDonutChart items={draft} />
      </div>

      {/* Category editor */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Categories
            </div>
            <div className="text-lg font-semibold text-white tracking-tight">
              항목별 예산
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Total
            </div>
            <div className="text-lg font-semibold text-mint tabular-nums">
              {total.toLocaleString()}
              <span className="text-xs text-white/50 ml-1">만원</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {BUDGET_CATEGORIES.map((cat) => {
            const item = draft.find((d) => d.category === cat.id)!;
            const pct = total > 0 ? (item.budget / total) * 100 : 0;
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
                  <TwEmoji emoji={cat.icon} size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {cat.description}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mint rounded-full transition-all duration-300"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10}
                    value={item.budget || ""}
                    onChange={(e) =>
                      setBudget(cat.id, parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className="w-20 sm:w-24 h-10 px-3 text-right text-sm font-medium bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums"
                  />
                  <span className="text-[11px] text-white/40">만원</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save bar */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/40 min-h-[16px] flex items-center gap-2 flex-wrap">
            {remoteUpdateCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sky-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-300" />
                </span>
                상대가 방금 업데이트했어요
              </span>
            )}
            {saveError ? (
              <span className="text-red-300">{saveError}</span>
            ) : savedAt ? (
              <span className="text-mint/70">
                {savedAt.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                저장됨
              </span>
            ) : isDirty ? (
              <span className="text-white/50">변경된 내용이 있습니다</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="h-10 px-4 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-50"
              >
                되돌리기
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="h-10 px-6 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
