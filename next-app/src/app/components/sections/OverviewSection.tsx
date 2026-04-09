"use client";

import { useMemo, useState } from "react";
import { BudgetItem } from "@/data/budgets";
import TwEmoji from "../ui/TwEmoji";
import BudgetDonutChart from "../ui/BudgetDonutChart";

/* ──────────────────────────────────────────────
   Types and sample data
   (replace sample events with a Supabase query
   when the `events` table exists.)
   ────────────────────────────────────────────── */

type EventType = "hall" | "studio" | "dress" | "makeup" | "other";

interface WeddingEvent {
  id: number;
  date: string; // ISO YYYY-MM-DD
  title: string;
  type: EventType;
  time?: string;
  location?: string;
}

const SAMPLE_EVENTS: WeddingEvent[] = [
  {
    id: 1,
    date: "2026-04-15",
    title: "제이오스티엘 투어",
    type: "hall",
    time: "14:00",
    location: "서울 구로구",
  },
  {
    id: 2,
    date: "2026-04-20",
    title: "신부 드레스 1차 피팅",
    type: "dress",
    time: "11:00",
    location: "강남 드레스 샵",
  },
  {
    id: 3,
    date: "2026-04-28",
    title: "SW 컨벤션 투어",
    type: "hall",
    time: "15:30",
    location: "서울 종로구",
  },
  {
    id: 4,
    date: "2026-05-05",
    title: "스튜디오 프리웨딩 촬영",
    type: "studio",
    time: "09:00",
    location: "용산 스튜디오",
  },
  {
    id: 5,
    date: "2026-05-12",
    title: "메이크업 리허설",
    type: "makeup",
    time: "10:30",
    location: "청담동",
  },
];

const TYPE_ICON: Record<EventType, string> = {
  hall: "💒",
  studio: "📸",
  dress: "👰",
  makeup: "💄",
  other: "📌",
};

const TYPE_LABEL: Record<EventType, string> = {
  hall: "웨딩홀",
  studio: "스튜디오",
  dress: "드레스",
  makeup: "메이크업",
  other: "기타",
};

/* ──────────────────────────────────────────────
   Main Overview Section
   ────────────────────────────────────────────── */

interface OverviewSectionProps {
  hallsCount: number;
  budgets: BudgetItem[];
}

export default function OverviewSection({
  hallsCount,
  budgets,
}: OverviewSectionProps) {
  const events = SAMPLE_EVENTS;

  return (
    <div className="space-y-6 md:space-y-8">
      <StatusCards hallsCount={hallsCount} eventsCount={events.length} />

      {/* Budget donut */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Budget
            </div>
            <div className="text-lg font-semibold text-white tracking-tight">
              예산 배분
            </div>
          </div>
          <div className="text-[11px] text-white/40">
            항목별 차지 비율
          </div>
        </div>
        <BudgetDonutChart items={budgets} />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.2fr_1fr]">
        <MonthCalendar events={events} />
        <UpcomingEventsList events={events} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Status cards (4 categories + events)
   ────────────────────────────────────────────── */

interface StatusCardsProps {
  hallsCount: number;
  eventsCount: number;
}

function StatusCards({ hallsCount, eventsCount }: StatusCardsProps) {
  const cards: {
    icon: string;
    label: string;
    count: number;
    accent: boolean;
  }[] = [
    { icon: "💒", label: "웨딩홀", count: hallsCount, accent: hallsCount > 0 },
    { icon: "📸", label: "스튜디오", count: 0, accent: false },
    { icon: "👰", label: "드레스", count: 0, accent: false },
    { icon: "💄", label: "메이크업", count: 0, accent: false },
    {
      icon: "📅",
      label: "예정 일정",
      count: eventsCount,
      accent: eventsCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={
            "bg-white/[0.04] backdrop-blur-xl border rounded-2xl p-5 transition-colors " +
            (c.accent
              ? "border-mint/30 shadow-[0_0_32px_-12px_rgba(0,255,225,0.4)]"
              : "border-white/10")
          }
        >
          <div className="flex items-center justify-between mb-3">
            <TwEmoji emoji={c.icon} size={22} />
            <div
              className={
                "text-[9px] font-semibold tracking-[0.15em] uppercase " +
                (c.accent ? "text-mint" : "text-white/30")
              }
            >
              {c.accent ? "Active" : "Empty"}
            </div>
          </div>
          <div
            className={
              "text-[28px] font-semibold leading-none mb-1.5 " +
              (c.accent ? "text-mint" : "text-white/80")
            }
          >
            {c.count}
          </div>
          <div className="text-[11px] text-white/50">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Month calendar with event markers
   ────────────────────────────────────────────── */

interface MonthCalendarProps {
  events: WeddingEvent[];
}

function MonthCalendar({ events }: MonthCalendarProps) {
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

          return (
            <div
              key={day}
              className={
                "aspect-square flex flex-col items-center justify-center relative rounded-lg text-sm transition-colors " +
                (isCurrentDay
                  ? "bg-mint/15 text-mint border border-mint/40"
                  : hasEvents
                    ? "text-white hover:bg-white/[0.06]"
                    : weekday === 0
                      ? "text-red-300/70 hover:bg-white/[0.04]"
                      : weekday === 6
                        ? "text-sky-300/70 hover:bg-white/[0.04]"
                        : "text-white/60 hover:bg-white/[0.04]")
              }
            >
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
}

function UpcomingEventsList({ events }: UpcomingEventsListProps) {
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
        <span className="text-[11px] text-white/40">
          {upcoming.length}건
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-sm text-white/40 mb-1">
            예정된 일정이 없습니다
          </div>
          <div className="text-[11px] text-white/30">
            새 일정을 추가해보세요
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => (
            <EventItem key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EventItemProps {
  event: WeddingEvent;
}

function EventItem({ event }: EventItemProps) {
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

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-colors">
      {/* Type icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
        <TwEmoji emoji={TYPE_ICON[event.type]} size={18} />
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
            {TYPE_LABEL[event.type]}
          </span>
        </div>
      </div>
    </div>
  );
}
