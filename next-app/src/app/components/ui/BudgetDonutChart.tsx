import type React from "react";
import {
  BudgetItem,
  BUDGET_CATEGORIES,
  totalBudget,
} from "@/data/budgets";
import TwEmoji from "./TwEmoji";

interface Props {
  items: BudgetItem[];
}

// Fixed chart geometry. Parameterize later if needed.
const SIZE = 180;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut chart for budget allocation. Pure SVG, no chart library.
 *
 * Each category is drawn as a partial stroke of a single circle using
 * `stroke-dasharray` + `stroke-dashoffset` — the standard CSS trick
 * for segmented donuts. Segments start at 12 o'clock (rotate -90°).
 */
export default function BudgetDonutChart({ items }: Props) {
  const total = totalBudget(items);
  const budgetByCategory = new Map(
    items.map((i) => [i.category, i.budget || 0])
  );

  let cumulativePct = 0;
  const segments = BUDGET_CATEGORIES.map((cat) => {
    const value = budgetByCategory.get(cat.id) || 0;
    const pct = total > 0 ? (value / total) * 100 : 0;
    const segment = {
      meta: cat,
      value,
      pct,
      dashArray: `${(pct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -(cumulativePct / 100) * CIRCUMFERENCE,
    };
    cumulativePct += pct;
    return segment;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG donut */}
      <div className="relative flex-shrink-0 w-[180px] h-[180px]">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Base ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Segments (only render if total > 0) */}
          {total > 0 && (
            <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
              {segments.map(
                (s) =>
                  s.pct > 0 && (
                    <circle
                      key={s.meta.id}
                      cx={CENTER}
                      cy={CENTER}
                      r={RADIUS}
                      fill="none"
                      stroke={s.meta.color}
                      strokeWidth={STROKE}
                      strokeDasharray={s.dashArray}
                      strokeDashoffset={s.dashOffset}
                      strokeLinecap="butt"
                    />
                  )
              )}
            </g>
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {total > 0 ? (
            <>
              <div className="text-[9px] font-semibold text-white/40 tracking-[0.2em] uppercase">
                Total
              </div>
              <div className="text-[18px] font-semibold text-white leading-tight mt-0.5">
                {total.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/50">만원</div>
            </>
          ) : (
            <div className="text-[10px] text-white/40 text-center px-3 leading-relaxed">
              예산을
              <br />
              입력해주세요
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full min-w-0 space-y-2">
        {segments.map((s) => (
          <div key={s.meta.id} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[var(--dot)]"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ ["--dot" as string]: s.meta.color } as React.CSSProperties}
              aria-hidden
            />
            <TwEmoji emoji={s.meta.icon} size={14} />
            <div className="flex-1 min-w-0 text-[12px] text-white/80 truncate">
              {s.meta.label}
            </div>
            <div className="text-[11px] text-white/50 tabular-nums flex-shrink-0">
              {s.value > 0 ? `${s.value.toLocaleString()}만` : "—"}
            </div>
            <div className="text-[11px] font-medium text-mint tabular-nums flex-shrink-0 w-10 text-right">
              {s.pct > 0 ? `${Math.round(s.pct)}%` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
