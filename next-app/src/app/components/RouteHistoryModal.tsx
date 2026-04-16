"use client";

/**
 * 임장 히스토리 모달 — 현재 상태를 저장하거나 과거 저장본을 불러온다.
 *
 * Parent responsibilities:
 * - `currentPayload`: 저장할 현재 경로 상태 (null이면 저장 탭 비활성)
 * - `onLoad(payload)`: 과거 저장본을 선택했을 때의 콜백 — 부모가 상태에
 *   반영 후 모달을 닫는다.
 *
 * 저장된 히스토리는 `/api/routes` 에서 fetch. 생성/삭제는 모달 내부에서
 * 직접 처리하되, 성공 시 목록을 다시 로드한다.
 */

import { useCallback, useEffect, useState } from "react";
import TwEmoji from "./ui/TwEmoji";
import { useAlert, useConfirm } from "./ui/ConfirmModal";
import { RouteHistory, RoutePayload, summarizeRoute } from "@/data/routes";

interface Props {
  onClose: () => void;
  onLoad: (payload: RoutePayload) => void;
  /** 현재 경로 상태 — null이거나 stops가 비어있으면 저장 불가. */
  currentPayload: RoutePayload | null;
}

const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all";

export default function RouteHistoryModal({
  onClose,
  onLoad,
  currentPayload,
}: Props) {
  const [tab, setTab] = useState<"save" | "list">(
    currentPayload && (currentPayload.stops?.length || 0) > 0 ? "save" : "list"
  );
  const [routes, setRoutes] = useState<RouteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const showAlert = useAlert();
  const showConfirm = useConfirm();

  // Save form
  const [name, setName] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/routes");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setRoutes(data);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ESC + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const canSave =
    !!currentPayload && (currentPayload.stops?.length || 0) > 0;

  const handleSave = async () => {
    if (!canSave || !currentPayload) return;
    setSaving(true);
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          visitedAt: visitedAt || null,
          payload: currentPayload,
          note: note.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        await showAlert(d.error || "저장에 실패했습니다.");
        return;
      }
      await showAlert("경로가 저장되었습니다.", { title: "저장 완료", icon: "✅" });
      setName("");
      setVisitedAt("");
      setNote("");
      await fetchList();
      setTab("list");
    } catch {
      await showAlert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: RouteHistory) => {
    const label = r.name || `#${r.id}`;
    const ok = await showConfirm(`"${label}" 히스토리를 삭제하시겠습니까?`, {
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/routes/${r.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        await showAlert(d.error || "삭제에 실패했습니다.");
        return;
      }
      setRoutes((prev) => prev.filter((x) => x.id !== r.id));
    } catch {
      await showAlert("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Route History
            </div>
            <h3 className="text-base font-semibold text-white">임장 히스토리</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 flex gap-1.5">
          <button
            type="button"
            onClick={() => setTab("save")}
            disabled={!canSave}
            className={
              "px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors " +
              (tab === "save"
                ? "bg-mint/15 text-mint border border-mint/30"
                : "text-white/50 border border-white/10 hover:text-white hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed")
            }
          >
            현재 경로 저장
          </button>
          <button
            type="button"
            onClick={() => setTab("list")}
            className={
              "px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors " +
              (tab === "list"
                ? "bg-mint/15 text-mint border border-mint/30"
                : "text-white/50 border border-white/10 hover:text-white hover:bg-white/[0.04]")
            }
          >
            저장된 경로 ({routes.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {tab === "save" ? (
            canSave ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
                    경로 이름
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 4/20 토요일 임장"
                    className={input}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
                    방문일
                  </label>
                  <input
                    type="date"
                    value={visitedAt}
                    onChange={(e) => setVisitedAt(e.target.value)}
                    className={input + " [color-scheme:dark]"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
                    메모
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="느낀 점, 좋았던 단지, 다음에 또 보고 싶은 곳..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all resize-y leading-relaxed"
                  />
                </div>

                {/* Summary preview */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-3">
                  <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    저장 내용
                  </div>
                  <div className="flex flex-wrap gap-2 text-[12px] text-white/70">
                    <span>
                      <span className="text-white/40">매물</span> {currentPayload.stops.length}곳
                    </span>
                    {currentPayload.start && (
                      <span>
                        <span className="text-white/40">· 출발</span>{" "}
                        {currentPayload.start.roadAddress}
                      </span>
                    )}
                    {currentPayload.end && !currentPayload.endSame && (
                      <span>
                        <span className="text-white/40">· 도착</span>{" "}
                        {currentPayload.end.roadAddress}
                      </span>
                    )}
                    {currentPayload.endSame && (
                      <span className="text-white/60">· 왕복</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="h-10 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-5 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-white/50 text-[13px]">
                저장할 매물이 없습니다. 매물을 먼저 선택해주세요.
              </div>
            )
          ) : loading ? (
            <div className="py-12 text-center text-white/50 text-[13px]">
              불러오는 중...
            </div>
          ) : routes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 mb-3">
                <TwEmoji emoji="📚" size={22} />
              </div>
              <div className="text-sm text-white/60 mb-1">저장된 경로가 없어요</div>
              <div className="text-[11px] text-white/35 leading-relaxed">
                오늘 다녀온 임장 동선을 저장해두면 나중에 다시 확인할 수 있어요.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {routes.map((r) => (
                <li
                  key={r.id}
                  className="relative rounded-xl bg-white/[0.03] border border-white/10 hover:border-mint/30 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => onLoad(r.payload)}
                    className="w-full text-left px-4 py-3 pr-12"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">
                            {r.name || `임장 #${r.id}`}
                          </span>
                          {r.visitedAt && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums text-mint bg-mint/10 border border-mint/25">
                              {r.visitedAt}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/45 mt-1 tabular-nums">
                          {summarizeRoute(r)}
                        </div>
                        {r.note && (
                          <div className="text-[11px] text-white/55 mt-1 line-clamp-2 leading-relaxed">
                            {r.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    aria-label="삭제"
                    className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-md text-white/25 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
