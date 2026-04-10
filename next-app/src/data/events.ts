// Shared event types + fixed type metadata.
// Used by: OverviewSection (calendar + upcoming list), EventFormModal,
// db.ts (Supabase mapping), /api/events routes.

export type EventType = "hall" | "studio" | "dress" | "makeup" | "other";

export interface WeddingEvent {
  id: number;
  /** ISO YYYY-MM-DD (date-only; time is separate) */
  date: string;
  title: string;
  type: EventType;
  /** Optional HH:MM string */
  time?: string;
  location?: string;
  memo?: string;
}

export interface EventTypeMeta {
  id: EventType;
  label: string;
  icon: string;
}

export const EVENT_TYPES: EventType[] = [
  "hall",
  "studio",
  "dress",
  "makeup",
  "other",
];

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  hall: { id: "hall", label: "웨딩홀", icon: "💒" },
  studio: { id: "studio", label: "스튜디오", icon: "📸" },
  dress: { id: "dress", label: "드레스", icon: "👰" },
  makeup: { id: "makeup", label: "메이크업", icon: "💄" },
  other: { id: "other", label: "기타", icon: "📌" },
};
