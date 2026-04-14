"use client";

import React, { useMemo, useState } from "react";
import { Complex, jeonseRatio, gap, dropFromPeak } from "@/data/complexes";
import TwEmoji from "../ui/TwEmoji";
import HousingGuide from "./HousingGuide";

interface Props {
  complexes: Complex[];
  loading: boolean;
  onEdit: (complex: Complex) => void;
}

type SortType = "default" | "price" | "gap" | "name";
type ViewMode = "list" | "compare";

const SORT_OPTIONS: { type: SortType; label: string }[] = [
  { type: "default", label: "기본" },
  { type: "price", label: "매매가 낮은순" },
  { type: "gap", label: "갭 적은순" },
  { type: "name", label: "이름순" },
];

/** Format price for chart labels — e.g. 29500 → "2.95억" */
function chartPrice(v: number): string {
  if (!v) return "-";
  if (v >= 10000) return `${(v / 10000).toFixed(2)}억`;
  return `${v.toLocaleString()}만`;
}

const BAR_COLORS = [
  "#00FFE1",
  "#10b981",
  "#60a5fa",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
];

export default function HousingSection({
  complexes,
  loading,
  onEdit,
}: Props) {
  const [sortType, setSortType] = useState<SortType>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [sortOpen, setSortOpen] = useState(false);

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

  const compareList = useMemo(
    () => complexes.filter((c) => compareIds.has(c.id)),
    [complexes, compareIds]
  );

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <SkeletonGrid />;

  const currentSort = SORT_OPTIONS.find((o) => o.type === sortType)!;

  return (
    <div>
      {/* Guide */}
      <HousingGuide />

      {/* Toolbar: view toggle (left) + sort dropdown (right) */}
      <div className="flex items-center justify-between mb-6">
        {/* View mode toggle */}
        <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors " +
              (viewMode === "list"
                ? "bg-mint text-gray-900"
                : "text-white/60 hover:text-white")
            }
          >
            <TwEmoji emoji="📋" size={13} /> 리스트
          </button>
          <button
            type="button"
            onClick={() => setViewMode("compare")}
            className={
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors " +
              (viewMode === "compare"
                ? "bg-mint text-gray-900"
                : "text-white/60 hover:text-white")
            }
          >
            <TwEmoji emoji="📊" size={13} /> 비교
            {compareIds.size > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-mint/20 text-mint text-[9px] font-bold">
                {compareIds.size}
              </span>
            )}
          </button>
        </div>

        {/* Sort dropdown */}
        {viewMode === "list" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
            >
              {currentSort.label}
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={
                  "transition-transform " + (sortOpen ? "rotate-180" : "")
                }
              >
                <path d="M4 6L8 10L12 6" />
              </svg>
            </button>
            {sortOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                  aria-label="닫기"
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 rounded-xl bg-[#0b0f14] border border-white/15 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        setSortType(opt.type);
                        setSortOpen(false);
                      }}
                      className={
                        "w-full text-left px-4 py-2 text-[11px] transition-colors " +
                        (sortType === opt.type
                          ? "text-mint font-semibold bg-mint/10"
                          : "text-white/70 hover:bg-white/[0.06] hover:text-white")
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── List view ── */}
      {viewMode === "list" && (
        <>
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sorted.map((c) => (
                <ComplexCard key={c.id} complex={c} onEdit={onEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Compare view ── */}
      {viewMode === "compare" && (
        <div className="space-y-6">
          {/* Selection chips */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-3">
              비교할 매물 선택
            </div>
            <div className="space-y-2">
              {complexes.map((c) => {
                const checked = compareIds.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border " +
                      (checked
                        ? "bg-mint/[0.08] border-mint/30"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCompare(c.id)}
                      className="sr-only"
                    />
                    <span
                      className={
                        "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors " +
                        (checked
                          ? "bg-mint border-mint text-gray-900"
                          : "bg-white/[0.06] border-white/20 text-transparent")
                      }
                    >
                      {checked && "✓"}
                    </span>
                    <span className="flex-1 text-sm text-white truncate">
                      {c.name}
                    </span>
                    {c.salePrice > 0 && (
                      <span className="text-[11px] text-mint/80 tabular-nums flex-shrink-0">
                        {chartPrice(c.salePrice)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          {compareList.length >= 2 ? (
            <ComparisonChart complexes={compareList} />
          ) : (
            <div className="text-center py-10 text-sm text-white/40">
              비교할 매물을 2개 이상 선택해주세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Comparison multi-line chart (SVG) ──────────────────────── */

interface ComparisonChartProps {
  complexes: Complex[];
}

interface MetricDef {
  key: string;
  label: string;
  getValue: (c: Complex) => number;
  format: (v: number) => string;
}

const ALL_METRICS: Record<string, MetricDef> = {
  sale: { key: "sale", label: "현재 매매가", getValue: (c) => c.salePrice, format: chartPrice },
  lastTrade: { key: "lastTrade", label: "직전 실거래가", getValue: (c) => c.lastTradePrice, format: chartPrice },
  peak: { key: "peak", label: "전고점", getValue: (c) => c.peakPrice, format: chartPrice },
  pyeong: { key: "pyeong", label: "평단가", getValue: (c) => c.pyeongPrice, format: chartPrice },
  school: {
    key: "school",
    label: "학업성취율",
    getValue: (c) => {
      const s = c.schoolScore?.replace(/[^0-9.]/g, "");
      return s ? parseFloat(s) : 0;
    },
    format: (v) => (v > 0 ? `${v}%` : "-"),
  },
};

/** Tab groups — each tab shows multiple metrics as X-axis points,
 *  with each complex as its own colored line. */
const CHART_TABS: { key: string; label: string; metricKeys: string[] }[] = [
  { key: "price", label: "매매가 vs 실거래가", metricKeys: ["lastTrade", "sale"] },
  { key: "peak", label: "전고점 비교", metricKeys: ["peak", "sale"] },
  { key: "pyeong", label: "평단가", metricKeys: ["pyeong"] },
  { key: "school", label: "학업성취율", metricKeys: ["school"] },
];

function ComparisonChart({ complexes }: ComparisonChartProps) {
  const [activeTab, setActiveTab] = useState(CHART_TABS[0].key);
  const tab = CHART_TABS.find((t) => t.key === activeTab) || CHART_TABS[0];
  const metrics = tab.metricKeys.map((k) => ALL_METRICS[k]);

  // Collect all values to determine Y range
  const allVals: number[] = [];
  complexes.forEach((c) => metrics.forEach((m) => {
    const v = m.getValue(c);
    if (v > 0) allVals.push(v);
  }));
  const max = allVals.length > 0 ? Math.max(...allVals) : 1;
  const min = allVals.length > 0 ? Math.min(...allVals) : 0;
  const range = max - min || 1;
  // Add 10% padding top/bottom
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.1;
  const yRange = yMax - yMin;

  // SVG dimensions — generous padding so labels stay inside
  const W = 600;
  const H = 300;
  const PAD_L = 90;
  const PAD_R = 90;
  const PAD_T = 50;
  const PAD_B = 60;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // X positions — inset from edges so dots sit at text center, not edge
  const INSET = 40;
  const innerW = chartW - INSET * 2;
  const xPositions = metrics.map(
    (_, i) =>
      PAD_L +
      INSET +
      (metrics.length > 1 ? (innerW / (metrics.length - 1)) * i : innerW / 2)
  );

  const yScale = (v: number) =>
    PAD_T + chartH - ((v - yMin) / yRange) * chartH;

  // Grid lines
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const v = yMin + (yRange / (gridCount - 1)) * i;
    return { y: yScale(v), label: metrics[0].format(Math.round(v)) };
  });

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">
      <div>
        <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
          Comparison
        </div>
        <div className="text-lg font-semibold text-white tracking-tight">
          매물 비교
        </div>
      </div>

      {/* Tab group selector */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {CHART_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={
              "flex-shrink-0 px-3.5 py-2 rounded-lg text-[11px] font-medium transition-colors " +
              (activeTab === t.key
                ? "bg-mint text-gray-900"
                : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Legend — one color per complex */}
      <div className="flex flex-wrap gap-3">
        {complexes.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
            <span className="text-[11px] text-white/80 truncate max-w-[120px]">
              {c.name}
            </span>
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[400px]"
          aria-label={`${tab.label} 비교 차트`}
        >
          {/* Grid */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={g.y}
                y2={g.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <text
                x={PAD_L - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[9px] fill-white/30"
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* X-axis metric labels */}
          {metrics.map((m, i) => (
            <text
              key={m.key}
              x={xPositions[i]}
              y={H - PAD_B + 20}
              textAnchor="middle"
              className="text-[10px] fill-white/50 font-medium"
            >
              {m.label}
            </text>
          ))}

          {/* One line per complex */}
          {complexes.map((c, ci) => {
            const color = BAR_COLORS[ci % BAR_COLORS.length];
            const pts = metrics.map((m, mi) => {
              const v = m.getValue(c);
              return { x: xPositions[mi], y: yScale(v), val: v };
            }).filter((p) => p.val > 0);

            if (pts.length === 0) return null;

            const path = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
              .join(" ");

            return (
              <g key={c.id}>
                {/* Line */}
                {pts.length > 1 && (
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* Dots + value labels */}
                {pts.map((p, pi) => {
                  const labelY = p.y - 14 + ci * -14;
                  return (
                    <g key={pi}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill={color}
                        stroke="#020806"
                        strokeWidth="2"
                      />
                      <text
                        x={p.x}
                        y={Math.max(labelY, PAD_T - 4)}
                        textAnchor="middle"
                        className="text-[9px] font-semibold"
                        fill={color}
                      >
                        {metrics[pi].format(p.val)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Data table — shows all metrics for each complex */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
        <div className="grid gap-px bg-white/5" style={{ gridTemplateColumns: `1fr ${metrics.map(() => "1fr").join(" ")}` }}>
          {/* Header row */}
          <div className="bg-[#0b0f14] px-3 py-2 text-[10px] text-white/40 font-medium">
            매물
          </div>
          {metrics.map((m) => (
            <div key={m.key} className="bg-[#0b0f14] px-3 py-2 text-[10px] text-white/40 font-medium text-right">
              {m.label}
            </div>
          ))}
          {/* Data rows */}
          {complexes.map((c, i) => (
            <React.Fragment key={c.id}>
              <div className="bg-[#0b0f14] px-3 py-2.5 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                />
                <span className="text-[11px] text-white/80 truncate">{c.name}</span>
              </div>
              {metrics.map((m) => (
                <div key={m.key} className="bg-[#0b0f14] px-3 py-2.5 text-[11px] font-semibold text-white tabular-nums text-right">
                  {m.format(m.getValue(c))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
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
        {c.pyeongPrice > 0 && (
          <StatBadge label="평단가" value={formatPrice(c.pyeongPrice)} />
        )}
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
            {/* 단지정보 */}
            {(c.city || c.district || c.dong || c.yearUnits || c.area || c.address) && (
              <DetailSection icon="🏢" title="단지정보">
                <DetailRow label="시" value={c.city} />
                <DetailRow label="구" value={c.district} />
                <DetailRow label="동" value={c.dong} />
                <DetailRow label="연식 / 세대수" value={c.yearUnits} />
                <DetailRow label="공급 / 전용면적" value={c.area} />
                <DetailRow label="도로명주소" value={c.address ?? ""} />
              </DetailSection>
            )}

            {/* 가격정보 (전체) */}
            {(c.salePrice || c.pyeongPrice || c.jeonsePrice || c.peakPrice || c.lowPrice || c.lastTradePrice) > 0 && (
              <DetailSection icon="💰" title="가격정보">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <PriceStat label="매매가" value={c.salePrice} accent />
                  <PriceStat label="평단가" value={c.pyeongPrice} />
                  <PriceStat label="전세가" value={c.jeonsePrice} />
                  <PriceStat label="직전 실거래" value={c.lastTradePrice} />
                  <PriceStat label="전고점" value={c.peakPrice} />
                  <PriceStat label="전저점" value={c.lowPrice} />
                </div>
              </DetailSection>
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
  pyeongPrice: 8500,
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
