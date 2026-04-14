"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BudgetItem,
  BUDGET_CATEGORIES,
  BUDGET_ICONS,
  CUSTOM_PALETTE,
  isCustomCategory,
  isFixedCategory,
  makeCustomId,
  totalBudget,
  totalBudgetTarget,
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

function key(item: BudgetItem) {
  return item.category;
}

/**
 * Custom-styled checkbox that matches the dark glass theme. The native
 * <input> is absolutely positioned with `opacity-0` so the entire
 * 16×16 area is clickable and keyboard-accessible, while the box and
 * checkmark are rendered as siblings driven by Tailwind's `peer-*`
 * variants. Wrap in a <label> if you want adjacent text to also
 * trigger the toggle (HTML bubbles label clicks to nested inputs).
 */
interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}
function Checkbox({ checked, onChange, disabled, ariaLabel }: CheckboxProps) {
  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange?.()}
        disabled={disabled}
        aria-label={ariaLabel}
        className={
          "peer absolute inset-0 m-0 opacity-0 " +
          (disabled ? "cursor-not-allowed" : "cursor-pointer")
        }
      />
      <span
        className={
          "absolute inset-0 rounded-[5px] border transition-colors " +
          "border-white/25 bg-white/[0.06] " +
          "peer-hover:border-white/40 peer-hover:bg-white/[0.09] " +
          "peer-checked:bg-mint peer-checked:border-mint peer-checked:shadow-[0_0_10px_-2px_rgba(0,255,225,0.5)] " +
          "peer-focus-visible:ring-2 peer-focus-visible:ring-mint/40 " +
          "peer-disabled:opacity-40 peer-disabled:bg-white/[0.02]"
        }
        aria-hidden="true"
      />
      <svg
        className="absolute w-3 h-3 text-gray-900 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 6.5 L5 9 L9.5 3.5" />
      </svg>
    </span>
  );
}

/** Produce a lookup Map from a list, keyed by category. */
function toMap(items: BudgetItem[]): Map<string, BudgetItem> {
  return new Map(items.map((i) => [i.category, i]));
}

export default function BudgetSection({ initial, onSaved }: Props) {
  const [draft, setDraft] = useState<BudgetItem[]>(() => withDefaults(initial));
  const [totalTarget, setTotalTarget] = useState<number>(() =>
    totalBudgetTarget(initial)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [remoteUpdateCount, setRemoteUpdateCount] = useState(0);
  // Tracks which custom row (by category id) currently has the icon
  // picker popover open. null means closed. Only one open at a time.
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // ── Edit mode (bulk delete with checkboxes) ──
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // When a confirm dialog is active, it holds the ids pending deletion.
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  // Close the icon picker on outside click + Escape key.
  useEffect(() => {
    if (!iconPickerFor) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setIconPickerFor(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIconPickerFor(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [iconPickerFor]);

  // Baselines are keyed by `category` rather than array index so that
  // adding/removing custom rows doesn't desync the merge. On realtime
  // updates we reconcile per key.
  const lastBaseline = useRef<Map<string, BudgetItem>>(
    toMap(withDefaults(initial))
  );
  const lastTotalBaseline = useRef<number>(totalBudgetTarget(initial));

  useEffect(() => {
    const newBaselineList = withDefaults(initial);
    const newBaseline = toMap(newBaselineList);
    const newTotalBaseline = totalBudgetTarget(initial);
    let changed = false;

    setDraft((prev) => {
      const prevMap = toMap(prev);
      const merged: BudgetItem[] = [];
      const seen = new Set<string>();

      // Walk the new baseline order (fixed first, then custom-in-baseline).
      // For each, preserve local edits on category/label/budget if the
      // user has touched them, otherwise adopt remote.
      for (const remote of newBaselineList) {
        const local = prevMap.get(remote.category);
        const baselineEntry = lastBaseline.current.get(remote.category);
        if (!local) {
          // Remote added a new row the local session never saw yet.
          merged.push({ ...remote });
          changed = true;
        } else {
          const localEdited =
            local.budget !== (baselineEntry?.budget ?? 0) ||
            (local.label ?? "") !== (baselineEntry?.label ?? "");
          if (localEdited) {
            merged.push(local);
          } else {
            if (
              local.budget !== remote.budget ||
              (local.label ?? "") !== (remote.label ?? "")
            ) {
              changed = true;
            }
            merged.push({ ...remote });
          }
        }
        seen.add(remote.category);
      }

      // Preserve any local-only custom rows the user added but hasn't
      // saved yet (they don't exist in the new baseline). Drop any
      // other local-only rows — they represent remote deletions the
      // baseline already captured.
      for (const local of prev) {
        if (seen.has(local.category)) continue;
        if (isCustomCategory(local.category)) {
          const baselineEntry = lastBaseline.current.get(local.category);
          if (!baselineEntry) {
            // Never persisted — purely local addition. Keep it.
            merged.push(local);
          }
          // else: was in baseline but removed remotely → drop.
        }
      }
      return merged;
    });

    setTotalTarget((prev) => {
      const userEdited = prev !== lastTotalBaseline.current;
      if (userEdited) return prev;
      if (prev !== newTotalBaseline) changed = true;
      return newTotalBaseline;
    });

    lastBaseline.current = newBaseline;
    lastTotalBaseline.current = newTotalBaseline;
    if (changed) {
      setRemoteUpdateCount((c) => c + 1);
    }
  }, [initial]);

  const total = useMemo(() => totalBudget(draft), [draft]);
  const remaining = totalTarget - total;

  const isDirty = useMemo(() => {
    if (totalTarget !== lastTotalBaseline.current) return true;
    // Compare each draft row against baseline by key
    if (draft.length !== lastBaseline.current.size) return true;
    for (const d of draft) {
      const base = lastBaseline.current.get(d.category);
      if (!base) return true;
      if (d.budget !== base.budget) return true;
      if ((d.label ?? "") !== (base.label ?? "")) return true;
      if ((d.icon ?? "") !== (base.icon ?? "")) return true;
    }
    return false;
  }, [draft, totalTarget]);

  const setBudget = (category: string, value: number) => {
    setDraft((prev) =>
      prev.map((p) =>
        p.category === category
          ? { ...p, budget: Number.isFinite(value) ? Math.max(0, value) : 0 }
          : p
      )
    );
    setSaveError(null);
  };

  const setLabel = (category: string, label: string) => {
    setDraft((prev) =>
      prev.map((p) => (p.category === category ? { ...p, label } : p))
    );
    setSaveError(null);
  };

  const setIcon = (category: string, icon: string) => {
    setDraft((prev) =>
      prev.map((p) => (p.category === category ? { ...p, icon } : p))
    );
    setIconPickerFor(null);
    setSaveError(null);
  };

  const addCustomRow = () => {
    const id = makeCustomId();
    setDraft((prev) => [
      ...prev,
      { category: id, budget: 0, label: "", icon: "📌" },
    ]);
    setSaveError(null);
  };

  // ── Edit mode helpers ────────────────────────────
  // Only custom rows are selectable; fixed categories can't be deleted.
  const selectableIds = useMemo(
    () => draft.filter((d) => isCustomCategory(d.category)).map((d) => d.category),
    [draft]
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const enterEditMode = () => {
    setEditMode(true);
    setSelectedIds(new Set());
    setIconPickerFor(null);
  };
  const exitEditMode = () => {
    setEditMode(false);
    setSelectedIds(new Set());
  };
  const toggleSelect = (category: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (selectableIds.every((id) => prev.has(id))) return new Set();
      return new Set(selectableIds);
    });
  };

  /**
   * Decide whether a row "has registered info". A row counts as having
   * data if it has a non-empty label OR a non-zero budget. Empty
   * placeholder rows (just added, never filled in) can be silently
   * removed without a confirmation prompt.
   */
  const rowHasData = (item: BudgetItem | undefined): boolean => {
    if (!item) return false;
    return ((item.label ?? "").trim().length > 0) || item.budget > 0;
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const needsConfirm = ids.some((id) =>
      rowHasData(draft.find((d) => d.category === id))
    );
    if (needsConfirm) {
      setConfirmDelete(ids);
    } else {
      performDelete(ids);
    }
  };
  const performDelete = (ids: string[]) => {
    setDraft((prev) => prev.filter((p) => !ids.includes(p.category)));
    if (iconPickerFor && ids.includes(iconPickerFor)) setIconPickerFor(null);
    setSelectedIds(new Set());
    setConfirmDelete(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Append the pseudo-category `total` to the payload. Server
      // validator accepts it and db.upsertBudgets stores it alongside
      // the other rows (and also reconciles custom deletions).
      const payload: BudgetItem[] = [
        ...draft.map((d) => ({ ...d })),
        { category: "total", budget: Math.max(0, Math.floor(totalTarget) || 0) },
      ];
      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "저장에 실패했습니다.");
        return;
      }
      // Drop unsaved empty-labelled custom rows from local draft too,
      // mirroring the server's filter (so they don't resurrect on the
      // next remote merge comparison).
      const cleanedDraft = draft.filter(
        (d) => !(isCustomCategory(d.category) && !(d.label ?? "").trim())
      );
      lastBaseline.current = toMap(cleanedDraft);
      lastTotalBaseline.current = totalTarget;
      setDraft(cleanedDraft);
      setSavedAt(new Date());
      setRemoteUpdateCount(0);
      onSaved([
        ...cleanedDraft,
        { category: "total", budget: totalTarget },
      ]);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Restore to the most recent server baseline (which may have been
    // updated by another user since this edit started).
    setDraft(Array.from(lastBaseline.current.values()).map((b) => ({ ...b })));
    setTotalTarget(lastTotalBaseline.current);
    setSaveError(null);
    setSavedAt(null);
    setRemoteUpdateCount(0);
  };

  // Count custom items for palette indexing (deterministic per render).
  let customCursor = 0;

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

      {/* Total budget target */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Target
            </div>
            <div className="text-lg font-semibold text-white tracking-tight">
              총 예산
            </div>
            <div className="text-[11px] text-white/40 mt-1 leading-relaxed">
              전체 결혼 예산 목표 금액을 설정하세요
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={totalTarget || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setTotalTarget(Number.isFinite(v) ? Math.max(0, v) : 0);
                  setSaveError(null);
                }}
                placeholder="0"
                className="w-32 sm:w-40 h-11 pl-3.5 pr-11 text-right text-base font-semibold bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                만원
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar + comparison with category sum */}
        {totalTarget > 0 && (
          <>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={
                  "h-full rounded-full transition-all duration-300 " +
                  (remaining >= 0 ? "bg-mint" : "bg-red-400")
                }
                 
                style={{
                  width: `${Math.min(100, (total / totalTarget) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px]">
              <span className="text-white/50">
                배분 합계{" "}
                <span className="text-white/80 font-medium tabular-nums">
                  {total.toLocaleString()}
                </span>
                <span className="text-white/40 ml-0.5">만원</span>
              </span>
              {remaining >= 0 ? (
                <span className="text-mint font-medium tabular-nums">
                  +{remaining.toLocaleString()}
                  <span className="text-white/40 ml-0.5">만원 여유</span>
                </span>
              ) : (
                <span className="text-red-300 font-medium tabular-nums">
                  {remaining.toLocaleString()}
                  <span className="text-red-300/60 ml-0.5">만원 초과</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Category editor */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Categories
            </div>
            <div className="text-lg font-semibold text-white tracking-tight">
              항목별 예산
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!editMode ? (
              <>
                <button
                  type="button"
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 2 L14 5 L5 14 L2 14 L2 11 Z" />
                  </svg>
                  편집
                </button>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    Sum
                  </div>
                  <div className="text-lg font-semibold text-mint tabular-nums">
                    {total.toLocaleString()}
                    <span className="text-xs text-white/50 ml-1">만원</span>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={exitEditMode}
                className="h-9 px-4 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
              >
                완료
              </button>
            )}
          </div>
        </div>

        {/* Edit-mode toolbar */}
        {editMode && (
          <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <label
              className={
                "flex items-center gap-2.5 select-none text-xs text-white/80 " +
                (selectableIds.length === 0
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer")
              }
            >
              <Checkbox
                checked={allSelected}
                onChange={toggleSelectAll}
                disabled={selectableIds.length === 0}
                ariaLabel="전체 선택"
              />
              <span>전체 선택</span>
              <span className="text-white/40 tabular-nums">
                ({selectedIds.size}/{selectableIds.length})
              </span>
            </label>
            <button
              type="button"
              onClick={handleBulkDeleteClick}
              disabled={!someSelected}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[11px] font-semibold bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25 hover:border-red-400/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4 L13 4 M6 4 L6 2 L10 2 L10 4 M5 4 L5 14 L11 14 L11 4" />
              </svg>
              선택 삭제
            </button>
          </div>
        )}

        <div className="space-y-3">
          {draft.map((item) => {
            const pct = total > 0 ? (item.budget / total) * 100 : 0;
            const fixed = isFixedCategory(item.category);
            const fixedMeta = fixed
              ? BUDGET_CATEGORIES.find((c) => c.id === item.category)!
              : null;
            const customColor = fixed
              ? null
              : CUSTOM_PALETTE[customCursor++ % CUSTOM_PALETTE.length];

            const currentIcon = fixed ? fixedMeta!.icon : item.icon || "📌";
            const pickerOpen = iconPickerFor === item.category;

            const selected = selectedIds.has(item.category);
            return (
              <div
                key={key(item)}
                className={
                  "relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-colors border " +
                  (editMode && !fixed && selected
                    ? "bg-mint/[0.08] border-mint/40"
                    : editMode && fixed
                      ? "bg-white/[0.01] border-white/5 opacity-60"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10")
                }
              >
                {/* Edit-mode checkbox (custom rows only) */}
                {editMode && (
                  <div className="flex-shrink-0 w-5 flex items-center justify-center">
                    <Checkbox
                      checked={selected}
                      onChange={() => toggleSelect(item.category)}
                      disabled={fixed}
                      ariaLabel={
                        fixed
                          ? "고정 항목은 삭제할 수 없음"
                          : `${item.label || "항목"} 선택`
                      }
                    />
                  </div>
                )}
                {fixed ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-mint/10 border border-mint/20">
                    <TwEmoji emoji={currentIcon} size={18} />
                  </div>
                ) : (
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setIconPickerFor((cur) =>
                          cur === item.category ? null : item.category
                        )
                      }
                      aria-label="아이콘 선택"
                      aria-expanded={pickerOpen}
                      className={
                        "group relative w-10 h-10 rounded-xl flex items-center justify-center border bg-[var(--chip-bg)] border-[var(--chip-br)] hover:border-white/30 transition-colors " +
                        (pickerOpen ? "ring-2 ring-mint/40" : "")
                      }
                       
                      style={
                        {
                          ["--chip-bg" as string]: `${customColor}26`,
                          ["--chip-br" as string]: `${customColor}55`,
                        } as React.CSSProperties
                      }
                    >
                      <TwEmoji emoji={currentIcon} size={18} />
                      {/* Tiny pencil indicator in the corner */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0b0f14] border border-white/20 flex items-center justify-center text-[8px] text-white/60 group-hover:text-mint transition-colors"
                        aria-hidden="true"
                      >
                        <svg
                          width="7"
                          height="7"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9 L2 10 L3 10 L9 4 L8 3 Z" />
                        </svg>
                      </span>
                    </button>
                    {pickerOpen && (
                      <div
                        ref={pickerRef}
                        className="absolute z-50 left-0 top-full mt-2 w-[256px] p-2 rounded-xl bg-[#0b0f14] border border-white/15 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)]"
                      >
                        <div className="grid grid-cols-6 gap-1">
                          {BUDGET_ICONS.map((ic) => {
                            const active = ic === currentIcon;
                            return (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => setIcon(item.category, ic)}
                                className={
                                  "aspect-square flex items-center justify-center rounded-lg transition-colors " +
                                  (active
                                    ? "bg-mint/20 border border-mint/50"
                                    : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20")
                                }
                                aria-label={`아이콘 ${ic}`}
                                aria-pressed={active}
                              >
                                <TwEmoji emoji={ic} size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {fixed ? (
                    <>
                      <div className="text-sm font-medium text-white truncate">
                        {fixedMeta!.label}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {fixedMeta!.description}
                      </div>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={item.label ?? ""}
                      onChange={(e) => setLabel(item.category, e.target.value)}
                      placeholder="항목명 (예: 허니문)"
                      className="w-full h-7 -ml-1.5 px-1.5 text-sm font-medium bg-transparent border border-transparent rounded text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.04] focus:border-white/10 transition-colors"
                    />
                  )}
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={
                        "h-full rounded-full transition-all duration-300 " +
                        (fixed ? "bg-mint" : "bg-[var(--bar)]")
                      }
                       
                      style={
                        fixed
                          ? { width: `${Math.min(100, pct)}%` }
                          : ({
                              width: `${Math.min(100, pct)}%`,
                              ["--bar" as string]: customColor,
                            } as React.CSSProperties)
                      }
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
                      setBudget(
                        item.category,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="0"
                    disabled={editMode}
                    className="w-20 sm:w-24 h-10 px-3 text-right text-sm font-medium bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <span className="text-[11px] text-white/40">만원</span>
                </div>
              </div>
            );
          })}

          {/* Add-custom-row button (hidden in edit mode) */}
          {!editMode && (
            <button
              type="button"
              onClick={addCustomRow}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-white/15 text-xs font-medium text-white/50 hover:text-mint hover:border-mint/40 hover:bg-mint/[0.04] transition-colors"
            >
              <span className="text-base leading-none">+</span>
              항목 추가
            </button>
          )}
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

      {/* ── Delete confirmation dialog ────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-500/15 border border-red-400/30 flex items-center justify-center">
                <TwEmoji emoji="⚠️" size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-red-300/80 tracking-[0.2em] uppercase mb-1">
                  Confirm Delete
                </div>
                <div className="text-base font-semibold text-white tracking-tight">
                  정말 삭제하시겠습니까?
                </div>
              </div>
            </div>
            <div className="text-[13px] text-white/60 leading-relaxed mb-5">
              선택한 <span className="text-white font-medium">{confirmDelete.length}개</span>
              {" "}항목에 등록된 정보가 있습니다. 삭제 후 저장하면 사이드바 탭도 함께 사라지고 복구할 수 없어요.
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 divide-y divide-white/5 mb-5 max-h-40 overflow-y-auto">
              {confirmDelete.map((id) => {
                const it = draft.find((d) => d.category === id);
                if (!it) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 px-3 py-2.5 text-[12px]"
                  >
                    <TwEmoji emoji={it.icon || "📌"} size={14} />
                    <span className="flex-1 min-w-0 text-white/80 truncate">
                      {it.label || "이름 없음"}
                    </span>
                    {it.budget > 0 && (
                      <span className="text-white/50 tabular-nums">
                        {it.budget.toLocaleString()}만원
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => performDelete(confirmDelete)}
                className="h-10 px-5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-100 border border-red-400/40 hover:bg-red-500/30 hover:border-red-400/60 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
