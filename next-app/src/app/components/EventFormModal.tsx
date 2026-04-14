"use client";

import { useEffect, useState } from "react";
import {
  EVENT_TYPE_META,
  EVENT_TYPES,
  EventType,
  WeddingEvent,
} from "@/data/events";
import TwEmoji from "./ui/TwEmoji";
import { useAlert, useConfirm } from "./ui/ConfirmModal";
import { useLoading } from "./ui/LoadingOverlay";

interface Props {
  event?: WeddingEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

// Shared dark-glass class strings — matches HallFormModal conventions.
const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all";
const textarea =
  "w-full px-3.5 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all resize-y leading-relaxed";
const label =
  "block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5";
const sectionLabel =
  "text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase";
const primaryBtn =
  "h-11 px-6 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]";
const ghostBtn =
  "h-11 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-50";
const dangerBtn =
  "h-11 px-5 rounded-lg text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400/50 transition-colors";

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" />
    </svg>
  );
}

/** Return today's date in YYYY-MM-DD (local time, not UTC). */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EventFormModal({ event, onClose, onSaved }: Props) {
  const isEdit = !!event;

  const [date, setDate] = useState(todayISO());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("other");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const showConfirm = useConfirm();
  const showAlert = useAlert();
  const loadingCtx = useLoading();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setDate(event.date);
      setTitle(event.title);
      setType(event.type);
      setTime(event.time ?? "");
      setLocation(event.location ?? "");
      setMemo(event.memo ?? "");
    }
  }, [event]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("날짜를 정확히 선택해주세요.");
      return;
    }
    setSaving(true);
    loadingCtx.show();
    setError(null);

    const payload = {
      date,
      title: title.trim(),
      type,
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      memo: memo.trim() || undefined,
    };

    try {
      const url = isEdit ? `/api/events/${event!.id}` : "/api/events";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      onSaved();
      await showAlert(isEdit ? "수정 완료되었습니다." : "등록 완료되었습니다.", { title: "완료", icon: "✅" });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSaving(false);
      loadingCtx.hide();
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    const ok = await showConfirm(`"${event.title}" 일정을 삭제하시겠습니까?`, { variant: "danger" });
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "삭제에 실패했습니다.");
        return;
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]">
        {/* ── Header ────────────────────────────── */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <div className={sectionLabel + " mb-1"}>
              {isEdit ? "Edit Event" : "New Event"}
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isEdit ? "일정 수정" : "새 일정 등록"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
          {/* Title */}
          <div>
            <label className={label}>제목 *</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="예: 제이오스티엘 투어"
              className={input}
            />
          </div>

          {/* Type */}
          <div>
            <label className={label}>분류</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => {
                const meta = EVENT_TYPE_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={
                      "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-medium transition-colors " +
                      (active
                        ? "bg-mint/15 text-mint border border-mint/40 shadow-[0_0_20px_-6px_rgba(0,255,225,0.4)]"
                        : "bg-white/[0.04] text-white/60 border border-white/10 hover:text-white hover:bg-white/[0.08]")
                    }
                    aria-pressed={active}
                  >
                    <TwEmoji emoji={meta.icon} size={14} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>날짜 *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={input + " [color-scheme:dark]"}
              />
            </div>
            <div>
              <label className={label}>시간</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={input + " [color-scheme:dark]"}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={label}>장소</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 구로구"
              className={input}
            />
          </div>

          {/* Memo */}
          <div>
            <label className={label}>메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="이 일정에 대한 메모를 남겨주세요..."
              className={textarea}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 px-3 py-2.5 rounded-lg">
              <TwEmoji
                emoji="⚠️"
                size={13}
                className="flex-shrink-0 mt-0.5"
              />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02]">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className={dangerBtn}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className={ghostBtn}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting}
              className={primaryBtn}
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
