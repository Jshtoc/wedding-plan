"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Complex } from "@/data/complexes";
import { VisitNote } from "@/data/visitNotes";
import TwEmoji from "../ui/TwEmoji";
import { useAlert, useConfirm } from "../ui/ConfirmModal";
import { useLoading } from "../ui/LoadingOverlay";

interface Props {
  complexes: Complex[];
}

// ── Helpers ──────────────────────────────────────────────

const STARS = [1, 2, 3, 4, 5] as const;

const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all";
const textarea =
  "w-full px-3.5 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all resize-y leading-relaxed";
const label =
  "block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5";

/**
 * Resize an image File to max 800px (longest side) with JPEG 0.6 quality
 * and return a data-URI string (base64). This keeps each photo under ~80KB
 * so storing them in JSONB is practical for a personal-use app.
 */
function resizeImage(file: File, maxSize = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ── Section ──────────────────────────────────────────────

export default function VisitNotesSection({ complexes }: Props) {
  const [notes, setNotes] = useState<VisitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VisitNote | null>(null);
  const [creating, setCreating] = useState(false);
  const showAlert = useAlert();
  const showConfirm = useConfirm();

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/visit-notes");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setNotes(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (note: VisitNote) => {
    const ok = await showConfirm(
      `"${note.title || "메모"}"를 삭제하시겠습니까?`,
      { variant: "danger" }
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/visit-notes/${note.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        await showAlert(d.error || "삭제에 실패했습니다.");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch {
      await showAlert("네트워크 오류");
    }
  };

  const complexById = new Map(complexes.map((c) => [c.id, c]));

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <>
      {/* Header + FAB */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
            Visit Notes
          </div>
          <div className="text-lg font-semibold text-white tracking-tight">
            임장 메모
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-10 px-5 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
        >
          + 새 메모
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-3xl p-12 sm:p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mint/10 border border-mint/25 mb-5 shadow-[0_0_32px_-10px_rgba(0,255,225,0.5)]">
            <TwEmoji emoji="📝" size={32} />
          </div>
          <div className="text-base font-semibold text-white mb-2">
            아직 메모가 없어요
          </div>
          <div className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            임장 갈 때 현장에서 사진 찍고 특징 메모해두세요. 나중에 어떤 단지가
            좋았는지 한눈에 비교할 수 있어요.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const linked = note.complexId
              ? complexById.get(note.complexId)
              : null;
            return (
              <div
                key={note.id}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-mint/20 transition-colors group"
              >
                {/* Top row: title + complex + rating + actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white truncate">
                        {note.title || "임장 메모"}
                      </span>
                      {linked && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-mint bg-mint/10 border border-mint/25 truncate max-w-[140px]">
                          <TwEmoji emoji="🏠" size={10} />
                          {linked.name}
                        </span>
                      )}
                      {note.visitedAt && (
                        <span className="text-[10px] text-white/40 tabular-nums">
                          {note.visitedAt}
                        </span>
                      )}
                    </div>
                    {/* Stars */}
                    {note.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {STARS.map((s) => (
                          s <= note.rating ? (
                            <TwEmoji key={s} emoji="⭐" size={13} />
                          ) : (
                            <span key={s} className="text-[12px] text-white/15 leading-none select-none">
                              ★
                            </span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(note)}
                      aria-label="수정"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-mint hover:bg-mint/10 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11.5 1.5l3 3L5 14H2v-3z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note)}
                      aria-label="삭제"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Pros / Cons */}
                {(note.pros || note.cons) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {note.pros && (
                      <div className="flex items-start gap-2 bg-emerald-500/[0.06] border border-emerald-400/15 rounded-lg px-3 py-2">
                        <TwEmoji emoji="👍" size={13} className="flex-shrink-0 mt-0.5" />
                        <span className="text-[12px] text-emerald-200/80 leading-relaxed whitespace-pre-line">
                          {note.pros}
                        </span>
                      </div>
                    )}
                    {note.cons && (
                      <div className="flex items-start gap-2 bg-red-500/[0.06] border border-red-400/15 rounded-lg px-3 py-2">
                        <TwEmoji emoji="👎" size={13} className="flex-shrink-0 mt-0.5" />
                        <span className="text-[12px] text-red-200/80 leading-relaxed whitespace-pre-line">
                          {note.cons}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                {note.content && (
                  <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-line mb-3">
                    {note.content}
                  </p>
                )}

                {/* Photo grid */}
                {note.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {note.photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`사진 ${i + 1}`}
                        className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-white/10"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <NoteFormModal
          note={editing}
          complexes={complexes}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            fetchNotes();
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

// ── Form Modal ───────────────────────────────────────────

function NoteFormModal({
  note,
  complexes,
  onClose,
  onSaved,
}: {
  note: VisitNote | null;
  complexes: Complex[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!note;
  const showAlert = useAlert();
  const loadingCtx = useLoading();

  const [complexId, setComplexId] = useState<number | null>(
    note?.complexId ?? null
  );
  const [rating, setRating] = useState(note?.rating || 0);
  const [pros, setPros] = useState(note?.pros || "");
  const [cons, setCons] = useState(note?.cons || "");
  const [content, setContent] = useState(note?.content || "");
  const [photos, setPhotos] = useState<string[]>(note?.photos || []);
  const [visitedAt, setVisitedAt] = useState(note?.visitedAt || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Lock body scroll + ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const promises = Array.from(files).map((f) => resizeImage(f));
      const dataUris = await Promise.all(promises);
      setPhotos((prev) => [...prev, ...dataUris]);
    } catch {
      await showAlert("사진 처리에 실패했습니다.");
    } finally {
      setUploading(false);
      // Clear input so same file can be re-selected
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    loadingCtx.show();
    // 제목은 자동 생성: 매물명 + 날짜 (없으면 "임장 메모")
    const linkedName = complexId
      ? complexes.find((c) => c.id === complexId)?.name || ""
      : "";
    const autoTitle =
      [linkedName, visitedAt].filter(Boolean).join(" · ") || "임장 메모";
    const payload = {
      complexId,
      title: autoTitle,
      content: content.trim(),
      pros: pros.trim(),
      cons: cons.trim(),
      rating,
      photos,
      visitedAt: visitedAt || "",
    };
    const url = isEdit ? `/api/visit-notes/${note!.id}` : "/api/visit-notes";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        await showAlert(d.error || "저장에 실패했습니다.");
        return;
      }
      onSaved();
      await showAlert(isEdit ? "수정 완료되었습니다." : "메모가 저장되었습니다.", {
        title: "완료",
        icon: "✅",
      });
    } catch {
      await showAlert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
      loadingCtx.hide();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              {isEdit ? "Edit Note" : "New Note"}
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isEdit ? "메모 수정" : "새 임장 메모"}
            </h2>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
          {/* 방문일 */}
          <div>
            <label className={label}>방문일</label>
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className={input + " [color-scheme:dark]"}
            />
          </div>

          {/* 매물 선택 — 커스텀 드롭다운 (네이티브 select는 다크 테마 미지원) */}
          <div>
            <label className={label}>관련 매물</label>
            <ComplexPicker
              complexes={complexes}
              value={complexId}
              onChange={setComplexId}
            />
          </div>

          {/* 별점 */}
          <div>
            <label className={label}>평점</label>
            <div className="flex items-center gap-1">
              {STARS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(rating === s ? 0 : s)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  {s <= rating ? (
                    <TwEmoji emoji="⭐" size={20} />
                  ) : (
                    <span className="text-[18px] text-white/20 leading-none select-none">
                      ★
                    </span>
                  )}
                </button>
              ))}
              {rating > 0 && (
                <span className="text-[11px] text-white/50 ml-1">
                  {rating}점
                </span>
              )}
            </div>
          </div>

          {/* 장점 / 단점 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>
                <TwEmoji emoji="👍" size={11} className="inline mr-1" />
                장점
              </label>
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                rows={3}
                placeholder="역세권, 공원 가까움, 단지 관리 깔끔..."
                className={textarea}
              />
            </div>
            <div>
              <label className={label}>
                <TwEmoji emoji="👎" size={11} className="inline mr-1" />
                단점
              </label>
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                rows={3}
                placeholder="주차 부족, 소음, 구축 느낌..."
                className={textarea}
              />
            </div>
          </div>

          {/* 자유 메모 */}
          <div>
            <label className={label}>메모</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="현장에서 느낀 점, 주변 환경, 기타..."
              className={textarea}
            />
          </div>

          {/* 사진 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={label + " !mb-0"}>
                <TwEmoji emoji="📷" size={11} className="inline mr-1" />
                사진
              </label>
              <span className="text-[10px] text-white/30">
                {photos.length}장
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`사진 ${i + 1}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, j) => j !== i))
                    }
                    aria-label="사진 삭제"
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] shadow-lg"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Add button */}
              <label
                className={
                  "w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors cursor-pointer " +
                  (uploading
                    ? "border-mint/40 bg-mint/5"
                    : "border-white/10 bg-white/[0.02] hover:border-mint/30 hover:bg-mint/5")
                }
              >
                {uploading ? (
                  <svg className="animate-spin w-5 h-5 text-mint" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <>
                    <TwEmoji emoji="📷" size={18} />
                    <span className="text-[9px] text-white/40 font-medium">
                      추가
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoAdd}
                  className="sr-only"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-6 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
          >
            {saving ? "저장 중..." : isEdit ? "수정 완료" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom dropdown for complex selection ────────────────
// Native <select> ignores dark theme on the dropdown list (OS-level).
// This replaces it with a fully styled popover.

function ComplexPicker({
  complexes,
  value,
  onChange,
}: {
  complexes: Complex[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = value != null ? complexes.find((c) => c.id === value) : null;
  const display = selected
    ? `${selected.name}${selected.district ? ` (${selected.district})` : ""}`
    : "선택 안함";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-left flex items-center justify-between gap-2 text-white focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all"
      >
        <span className={selected ? "text-white truncate" : "text-white/40 truncate"}>
          {display}
        </span>
        <svg
          className={"flex-shrink-0 text-white/40 transition-transform " + (open ? "rotate-180" : "")}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl bg-[#111820] border border-white/15 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={
              "w-full text-left px-3.5 py-2.5 text-sm transition-colors " +
              (value === null
                ? "text-mint bg-mint/10"
                : "text-white/70 hover:bg-white/[0.06]")
            }
          >
            선택 안함
          </button>
          {complexes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className={
                "w-full text-left px-3.5 py-2.5 text-sm transition-colors " +
                (value === c.id
                  ? "text-mint bg-mint/10"
                  : "text-white/70 hover:bg-white/[0.06]")
              }
            >
              {c.name}
              {c.district ? (
                <span className="text-white/40 ml-1">({c.district})</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
