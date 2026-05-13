"use client";

import { useMemo, useState, useEffect } from "react";
import { BudgetItem } from "@/data/budgets";
import { EVENT_TYPE_META, WeddingEvent } from "@/data/events";
import TwEmoji from "../ui/TwEmoji";
import {
  CHECKLIST,
  CHECKED_KEY,
  DETAILS_KEY,
  TOTAL_BUDGET_KEY,
  type ItemDetail,
} from "./WeddingPlanSection";

const toNum = (val: string): number => {
  const n = Number((val ?? "").replace(/[^0-9]/g, ""));
  return isNaN(n) ? 0 : n;
};

/* ──────────────────────────────────────────────
   Main Overview Section
   ────────────────────────────────────────────── */

interface OverviewSectionProps {
  hallsCount?: number;
  studiosCount?: number;
  dressesCount?: number;
  makeupsCount?: number;
  budgets?: BudgetItem[];
  events: WeddingEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: WeddingEvent) => void;
}

export default function OverviewSection({
  events,
  onAddEvent,
  onEditEvent,
}: OverviewSectionProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      <WeddingProgressCards events={events} />
      <ChecklistCategoryProgress />
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.2fr_1fr]">
        <MonthCalendar events={events} onEditEvent={onEditEvent} />
        <UpcomingEventsList
          events={events}
          onAddEvent={onAddEvent}
          onEditEvent={onEditEvent}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Wedding Progress Cards
   ────────────────────────────────────────────── */

function WeddingProgressCards({ events }: { events: WeddingEvent[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, ItemDetail>>({});
  const [totalBudget, setTotalBudget] = useState("");

  useEffect(() => {
    try {
      const c = localStorage.getItem(CHECKED_KEY);
      const d = localStorage.getItem(DETAILS_KEY);
      const b = localStorage.getItem(TOTAL_BUDGET_KEY);
      if (c) setChecked(new Set(JSON.parse(c) as string[]));
      if (d) setDetails(JSON.parse(d) as Record<string, ItemDetail>);
      if (b) setTotalBudget(b);
    } catch {}
  }, []);

  const totalItems = CHECKLIST.reduce((a, c) => a + c.items.length, 0);
  const doneItems  = CHECKLIST.reduce((a, c) => a + c.items.filter((i) => checked.has(i.id)).length, 0);
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  const totalConfirmed = Object.values(details).reduce((s, d) => s + toNum(d.confirmed), 0);
  const totalEstimated = Object.values(details).reduce((s, d) => s + toNum(d.estimated), 0);
  const budgetGoal = toNum(totalBudget);
  const overBudget = budgetGoal > 0 && totalConfirmed > budgetGoal;

  // D-Day: nearest upcoming event
  const dDay = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = events
      .filter((e) => new Date(e.date).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (!upcoming.length) return null;
    const diff = Math.round((new Date(upcoming[0].date).getTime() - today.getTime()) / 86400000);
    return { label: upcoming[0].title, diff };
  }, [events]);

  const cards = [
    {
      icon: "✅",
      label: "체크리스트",
      value: `${doneItems}/${totalItems}`,
      sub: `${pct}% 완료`,
      accent: pct > 0,
      bar: pct,
      barColor: "bg-mint",
    },
    {
      icon: "💰",
      label: "예상 합계",
      value: totalEstimated > 0 ? `${totalEstimated.toLocaleString()}만` : "—",
      sub: "입력 기준",
      accent: totalEstimated > 0,
    },
    {
      icon: "✔️",
      label: "확정 합계",
      value: totalConfirmed > 0 ? `${totalConfirmed.toLocaleString()}만` : "—",
      sub: overBudget ? `+${(totalConfirmed - budgetGoal).toLocaleString()}만 초과` : budgetGoal > 0 ? `${(budgetGoal - totalConfirmed).toLocaleString()}만 여유` : "확정 기준",
      accent: totalConfirmed > 0,
      warn: overBudget,
    },
    {
      icon: "🎯",
      label: "목표 예산",
      value: budgetGoal > 0 ? `${budgetGoal.toLocaleString()}만` : "미설정",
      sub: budgetGoal > 0 && totalConfirmed > 0 ? `${Math.round((totalConfirmed / budgetGoal) * 100)}% 사용` : "웨딩플랜에서 설정",
      accent: budgetGoal > 0,
      bar: budgetGoal > 0 && totalConfirmed > 0 ? Math.min(Math.round((totalConfirmed / budgetGoal) * 100), 100) : undefined,
      barColor: overBudget ? "bg-red-400" : "bg-mint",
    },
  ];

  return (
    <div>
      {/* D-Day 배너 */}
      {dDay !== null && (
        <div className="mb-4 bg-mint/[0.07] border border-mint/20 rounded-2xl px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-mint/60 font-semibold uppercase tracking-wider mb-0.5">Next Event</div>
            <div className="text-sm font-semibold text-white">{dDay.label}</div>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${dDay.diff === 0 ? "text-mint" : "text-white/80"}`}>
            {dDay.diff === 0 ? "D-DAY" : `D-${dDay.diff}`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={
              "bg-white/[0.04] backdrop-blur-xl border rounded-2xl p-4 " +
              (c.warn ? "border-red-400/30" : c.accent ? "border-mint/25 shadow-[0_0_24px_-10px_rgba(0,255,225,0.3)]" : "border-white/10")
            }
          >
            <div className="flex items-center justify-between mb-2">
              <TwEmoji emoji={c.icon} size={18} />
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${c.warn ? "text-red-300/70" : c.accent ? "text-mint/70" : "text-white/25"}`}>
                {c.warn ? "Over" : c.accent ? "Active" : "Empty"}
              </span>
            </div>
            <div className={`text-[22px] font-bold leading-none mb-1 tabular-nums ${c.warn ? "text-red-300" : c.accent ? "text-white" : "text-white/40"}`}>
              {c.value}
            </div>
            <div className={`text-[10px] mb-2 ${c.warn ? "text-red-300/60" : "text-white/40"}`}>{c.sub}</div>
            {c.bar !== undefined && (
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${c.barColor}`} style={{ width: `${c.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Checklist Donut Chart
   ────────────────────────────────────────────── */

const CAT_COLORS = ["#00FFE1", "#A78BFA", "#F59E0B", "#F472B6", "#60A5FA"];

const D_SIZE   = 180;
const D_STROKE = 20;
const D_R      = (D_SIZE - D_STROKE) / 2;
const D_CX     = D_SIZE / 2;
const D_CIRC   = 2 * Math.PI * D_R;

function ChecklistCategoryProgress() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const c = localStorage.getItem(CHECKED_KEY);
      if (c) setChecked(new Set(JSON.parse(c) as string[]));
    } catch {}
  }, []);

  const cats = CHECKLIST.map((cat, idx) => {
    const done = cat.items.filter((i) => checked.has(i.id)).length;
    const pct  = cat.items.length ? Math.round((done / cat.items.length) * 100) : 0;
    return { ...cat, done, pct, color: CAT_COLORS[idx % CAT_COLORS.length] };
  });

  const totalItems = CHECKLIST.reduce((a, c) => a + c.items.length, 0);
  const totalDone  = cats.reduce((a, c) => a + c.done, 0);
  const overallPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  // 도넛: 전체 진행률 단일 원호
  const arcLen = (overallPct / 100) * D_CIRC;

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="mb-5">
        <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">Checklist</div>
        <div className="text-lg font-semibold text-white tracking-tight">준비 진행 현황</div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* 도넛 */}
        <div className="relative flex-shrink-0" style={{ width: D_SIZE, height: D_SIZE }}>
          <svg width={D_SIZE} height={D_SIZE} viewBox={`0 0 ${D_SIZE} ${D_SIZE}`}>
            {/* 베이스 링 */}
            <circle cx={D_CX} cy={D_CX} r={D_R} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth={D_STROKE} />
            {/* 진행 호: rotate(-90)으로 12시 시작, 수평 미러로 반시계 */}
            {overallPct > 0 && (
              <g transform={`scale(-1, 1) translate(-${D_SIZE}, 0) rotate(-90, ${D_CX}, ${D_CX})`}>
                <circle cx={D_CX} cy={D_CX} r={D_R} fill="none"
                  stroke="#00FFE1" strokeWidth={D_STROKE}
                  strokeDasharray={`${arcLen} ${D_CIRC}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </g>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
            <span className="text-[10px] font-medium text-white/40 tracking-widest">완료</span>
            <span className="text-[38px] font-bold text-white leading-none tabular-nums">
              {overallPct}<span className="text-[16px] font-normal text-white/50">%</span>
            </span>
            <span className="text-[11px] text-white/35 tabular-nums">{totalDone} / {totalItems}</span>
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="flex-1 w-full space-y-3.5">
          {cats.map((c) => (
            <div key={c.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="flex-1 text-[12px] text-white/80" style={{ wordBreak: "keep-all" }}>{c.label}</span>
                <span className="text-[11px] text-white/35 tabular-nums">{c.done}/{c.items.length}</span>
                <span className="text-[11px] font-semibold tabular-nums w-8 text-right"
                  style={{ color: c.pct === 100 ? c.color : c.pct > 0 ? c.color + "aa" : "rgba(255,255,255,0.2)" }}>
                  {c.pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.07]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${c.pct}%`, background: c.color, opacity: c.pct === 100 ? 1 : 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Month calendar with event markers
   ────────────────────────────────────────────── */

interface MonthCalendarProps {
  events: WeddingEvent[];
  onEditEvent: (event: WeddingEvent) => void;
}

function MonthCalendar({ events, onEditEvent }: MonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
    const daysInMonth = lastDay.getDate();

    const result: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, WeddingEvent[]>();
    for (const e of events) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const list = map.get(day) || [];
        list.push(e);
        map.set(day, list);
      }
    }
    return map;
  }, [events, year, month]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const monthLabel = viewMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
            Calendar
          </div>
          <div className="text-lg font-semibold text-white tracking-tight">
            {monthLabel}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="이전 달"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 h-9 rounded-lg text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="다음 달"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={
              "text-center text-[10px] font-medium py-2 " +
              (i === 0
                ? "text-red-300/70"
                : i === 6
                  ? "text-sky-300/70"
                  : "text-white/40")
            }
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const eventsOfDay = eventsByDay.get(day) || [];
          const hasEvents = eventsOfDay.length > 0;
          const isCurrentDay = isToday(day);
          const weekday = i % 7;

          const content = (
            <>
              <span className={isCurrentDay ? "font-semibold" : ""}>{day}</span>
              {hasEvents && (
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {eventsOfDay.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="w-1 h-1 rounded-full bg-mint"
                      aria-label={e.title}
                    />
                  ))}
                </div>
              )}
            </>
          );

          const baseClass =
            "aspect-square flex flex-col items-center justify-center relative rounded-lg text-sm transition-colors " +
            (isCurrentDay
              ? "bg-mint/15 text-mint border border-mint/40"
              : hasEvents
                ? "text-white hover:bg-white/[0.08] cursor-pointer"
                : weekday === 0
                  ? "text-red-300/70 hover:bg-white/[0.04]"
                  : weekday === 6
                    ? "text-sky-300/70 hover:bg-white/[0.04]"
                    : "text-white/60 hover:bg-white/[0.04]");

          // Clicking a day with events opens the first one for editing.
          // (Multi-event days could later show a popover.)
          return hasEvents ? (
            <button
              type="button"
              key={day}
              onClick={() => onEditEvent(eventsOfDay[0])}
              className={baseClass}
              aria-label={`${day}일 일정 ${eventsOfDay.length}건`}
            >
              {content}
            </button>
          ) : (
            <div key={day} className={baseClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Upcoming events list
   ────────────────────────────────────────────── */

interface UpcomingEventsListProps {
  events: WeddingEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: WeddingEvent) => void;
}

function UpcomingEventsList({
  events,
  onAddEvent,
  onEditEvent,
}: UpcomingEventsListProps) {
  const upcoming = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.date).getTime() >= todayStart.getTime())
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [events]);

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
            Schedule
          </div>
          <div className="text-lg font-semibold text-white tracking-tight">
            다가오는 일정
          </div>
        </div>
        <button
          type="button"
          onClick={onAddEvent}
          aria-label="일정 추가"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-mint hover:text-gray-900 bg-mint/10 hover:bg-mint border border-mint/30 hover:border-mint transition-colors"
        >
          <span className="text-sm leading-none">+</span>
          일정 추가
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-sm text-white/40 mb-1">
            예정된 일정이 없습니다
          </div>
          <div className="text-[11px] text-white/30">
            우측 상단 버튼으로 일정을 추가해보세요
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => (
            <EventItem
              key={e.id}
              event={e}
              onClick={() => onEditEvent(e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EventItemProps {
  event: WeddingEvent;
  onClick: () => void;
}

function EventItem({ event, onClick }: EventItemProps) {
  const d = new Date(event.date);
  const dateLabel = d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  // Days until event
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (d.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dDayLabel =
    diffDays === 0
      ? "D-DAY"
      : diffDays > 0
        ? `D-${diffDays}`
        : `D+${-diffDays}`;

  const meta = EVENT_TYPE_META[event.type];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-colors"
    >
      {/* Type icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
        <TwEmoji emoji={meta.icon} size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold text-mint tracking-wider">
            {dDayLabel}
          </span>
          <span className="text-[10px] text-white/30">•</span>
          <span className="text-[10px] text-white/50">{dateLabel}</span>
        </div>
        <div className="text-sm font-medium text-white truncate">
          {event.title}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          {event.time && <span>{event.time}</span>}
          {event.time && event.location && <span>·</span>}
          {event.location && <span className="truncate">{event.location}</span>}
          <span className="ml-auto text-white/30 flex-shrink-0">
            {meta.label}
          </span>
        </div>
      </div>
    </button>
  );
}
