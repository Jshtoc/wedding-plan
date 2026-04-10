"use client";

import { useEffect, useState } from "react";
import {
  DRESS_TARGET_META,
  DressTarget,
  Vendor,
  VENDOR_CATEGORIES,
  VendorCategory,
} from "@/data/vendors";
import TwEmoji from "./ui/TwEmoji";

interface Props {
  category: VendorCategory;
  vendor?: Vendor | null;
  /** Pre-select a dress target when opening the modal in create mode
   *  from a specific sub-tab (e.g. "bride" tab → bride). */
  defaultTarget?: DressTarget;
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

export default function VendorFormModal({
  category,
  vendor,
  defaultTarget,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!vendor;
  const meta = VENDOR_CATEGORIES[category];

  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [price, setPrice] = useState(0);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState<DressTarget>(defaultTarget ?? "bride");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setSub(vendor.sub);
      setPrice(vendor.price);
      setNote(vendor.note);
      if (vendor.target) setTarget(vendor.target);
    }
  }, [vendor]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(`${meta.label} 이름을 입력해주세요.`);
      return;
    }
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      sub: sub.trim(),
      price: Math.max(0, Math.floor(price) || 0),
      note: note.trim(),
    };
    if (category === "dress") {
      payload.target = target;
    }

    try {
      const url = isEdit
        ? `/api/vendors/${category}/${vendor!.id}`
        : `/api/vendors/${category}`;
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
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vendor) return;
    if (!confirm(`"${vendor.name}" 항목을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${category}/${vendor.id}`, {
        method: "DELETE",
      });
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

  const placeholder =
    category === "studio"
      ? "유디 스튜디오"
      : category === "dress"
        ? "더 브라이드"
        : "청담 메이크업";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <div className={sectionLabel + " mb-1"}>
              {isEdit ? `Edit ${meta.label}` : `New ${meta.label}`}
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isEdit ? `${meta.label} 수정` : `새 ${meta.label} 등록`}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
          {/* Dress-only: target */}
          {category === "dress" && (
            <div>
              <label className={label}>대상</label>
              <div className="flex gap-2">
                {(Object.keys(DRESS_TARGET_META) as DressTarget[]).map((t) => {
                  const m = DRESS_TARGET_META[t];
                  const active = target === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTarget(t)}
                      className={
                        "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-medium transition-colors " +
                        (active
                          ? "bg-mint/15 text-mint border border-mint/40 shadow-[0_0_20px_-6px_rgba(0,255,225,0.4)]"
                          : "bg-white/[0.04] text-white/60 border border-white/10 hover:text-white hover:bg-white/[0.08]")
                      }
                      aria-pressed={active}
                    >
                      <TwEmoji emoji={m.icon} size={14} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={label}>{meta.label} 이름 *</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={`예: ${placeholder}`}
              className={input}
            />
          </div>

          {/* Location */}
          <div>
            <label className={label}>위치</label>
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="예: 서울 강남구"
              className={input}
            />
          </div>

          {/* Price */}
          <div>
            <label className={label}>예상 가격</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={price || ""}
                onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={input + " pr-12"}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                만원
              </span>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className={label}>메모</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={`이 ${meta.label}에 대한 메모를 남겨주세요...`}
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

        {/* Footer */}
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
