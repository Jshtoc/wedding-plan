"use client";

import { useState, useEffect, useMemo } from "react";
import {
  WeddingHall,
  TransportMode,
  TRANSPORT_META,
  computePriceLevel,
} from "@/data/halls";
import { BudgetItem } from "@/data/budgets";
import TwEmoji from "./ui/TwEmoji";
import { useAlert } from "./ui/ConfirmModal";

interface Props {
  hall?: WeddingHall | null;
  /** Budgets from the parent — used to compute the price level dot.
   *  When the `hall` category budget is 0, the dot is hidden. */
  budgets: BudgetItem[];
  onClose: () => void;
  onSaved: () => void;
}

// ─── Shared dark-glass class strings ───
const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums";
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

export default function HallFormModal({
  hall,
  budgets,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!hall;

  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [price, setPrice] = useState(0);
  const [guests, setGuests] = useState(0);
  const [parking, setParking] = useState(0);
  const [transport, setTransport] = useState<TransportMode[]>([]);
  const [note, setNote] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGradeGuide, setShowGradeGuide] = useState(false);

  const showAlert = useAlert();

  // Look up the hall-category budget once per render. This drives the
  // traffic-light dot next to the price input.
  const hallBudget = useMemo(
    () => budgets.find((b) => b.category === "hall")?.budget ?? 0,
    [budgets]
  );
  const priceLevel = computePriceLevel(price, hallBudget);

  useEffect(() => {
    if (hall) {
      setName(hall.name);
      setSub(hall.sub);
      setPrice(hall.price);
      setGuests(hall.guests);
      setParking(hall.parking);
      setTransport(hall.transport ?? []);
      setNote(hall.note);
    }
  }, [hall]);

  const handleFetchPreview = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setPreviewError("URL을 입력해주세요.");
      return;
    }
    setFetchingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/fetch-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as {
        title?: string;
        description?: string;
        siteName?: string;
        error?: string;
      };
      if (!res.ok) {
        setPreviewError(data.error || "미리보기를 가져오지 못했습니다.");
        return;
      }
      // Fill only empty fields — never overwrite user input.
      if (data.title && !name) setName(data.title);
      if (data.siteName && !sub) setSub(data.siteName);
      if (data.description && !note) setNote(data.description);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setFetchingPreview(false);
    }
  };

  const toggleTransport = (mode: TransportMode) => {
    setTransport((prev) =>
      prev.includes(mode) ? prev.filter((t) => t !== mode) : [...prev, mode]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      await showAlert("웨딩홀 이름을 입력하세요.");
      return;
    }
    setSaving(true);

    const data: Omit<WeddingHall, "id"> = {
      name: name.trim(),
      sub: sub.trim(),
      price: Math.max(0, Math.floor(price) || 0),
      guests: Math.max(0, Math.floor(guests) || 0),
      parking: Math.max(0, Math.floor(parking) || 0),
      transport,
      note: note.trim(),
    };

    const url = isEdit ? `/api/halls/${hall!.id}` : "/api/halls";
    const method = isEdit ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <div className={sectionLabel + " mb-1"}>
              {isEdit ? "Edit Venue" : "New Venue"}
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isEdit ? "웨딩홀 수정" : "새 웨딩홀 등록"}
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

        {/* ── Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-7 space-y-6">
          {/* URL로 자동 입력 */}
          <div>
            <label className={label}>URL로 자동 입력 (선택)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchPreview();
                  }
                }}
                placeholder="웨딩홀 공식 페이지 URL 붙여넣기"
                className={input + " flex-1"}
                disabled={fetchingPreview}
              />
              <button
                type="button"
                onClick={handleFetchPreview}
                disabled={fetchingPreview}
                className={ghostBtn + " whitespace-nowrap"}
              >
                {fetchingPreview ? "불러오는 중..." : "가져오기"}
              </button>
            </div>
            {previewError && (
              <div className="mt-2 flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 px-3 py-2 rounded-lg">
                <TwEmoji
                  emoji="⚠️"
                  size={13}
                  className="flex-shrink-0 mt-0.5"
                />
                <span className="leading-relaxed">{previewError}</span>
              </div>
            )}
          </div>

          {/* 웨딩홀 이름 */}
          <div>
            <label className={label}>웨딩홀 이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 제이오스티엘"
              className={input}
            />
          </div>

          {/* 위치 */}
          <div>
            <label className={label}>위치</label>
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="예: 서울 구로구"
              className={input}
            />
          </div>

          {/* 예상 가격 + 색상 dot */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                예상 가격
              </span>
              {priceLevel && (
                <button
                  type="button"
                  onClick={() => setShowGradeGuide((v) => !v)}
                  aria-label="등급 안내"
                  className="w-4 h-4 flex items-center justify-center rounded-full bg-white/[0.08] text-white/40 hover:text-mint hover:bg-mint/10 transition-colors text-[10px] font-bold leading-none"
                >
                  ?
                </button>
              )}
            </div>
            {showGradeGuide && priceLevel && (
              <div className="mb-2 p-3 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] leading-relaxed space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-white/80">
                    <span className="font-semibold text-emerald-400">적정</span>
                    {" — "}예산 이내
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-white/80">
                    <span className="font-semibold text-amber-400">주의</span>
                    {" — "}예산 대비 +10% 이내
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-white/80">
                    <span className="font-semibold text-red-400">초과</span>
                    {" — "}예산 대비 +10% 초과
                  </span>
                </div>
                <div className="pt-1 mt-1 border-t border-white/10 text-white/40">
                  기준: 결혼 예산 → 웨딩홀 카테고리 {hallBudget.toLocaleString()}
                  만원
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
              {/* 색상 dot — 예산 항목이 설정된 경우에만 노출 */}
              <div
                className={
                  "flex-shrink-0 w-11 h-11 rounded-lg border flex items-center justify-center " +
                  (priceLevel === "ok"
                    ? "bg-emerald-500/10 border-emerald-400/30"
                    : priceLevel === "warn"
                      ? "bg-amber-500/10 border-amber-400/30"
                      : priceLevel === "over"
                        ? "bg-red-500/10 border-red-400/30"
                        : "bg-white/[0.02] border-white/10")
                }
                aria-label={
                  priceLevel === "ok"
                    ? "적정"
                    : priceLevel === "warn"
                      ? "주의"
                      : priceLevel === "over"
                        ? "초과"
                        : "예산 미설정"
                }
              >
                <span
                  className={
                    "w-3 h-3 rounded-full " +
                    (priceLevel === "ok"
                      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                      : priceLevel === "warn"
                        ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                        : priceLevel === "over"
                          ? "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.6)]"
                          : "bg-white/20")
                  }
                />
              </div>
            </div>
            {!priceLevel && hallBudget <= 0 && (
              <div className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                예산 등급 표시는 결혼 예산 → 웨딩홀 항목을 먼저 설정하면
                활성화됩니다.
              </div>
            )}
          </div>

          {/* 보증인원 */}
          <div>
            <label className={label}>보증인원</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={guests || ""}
                onChange={(e) => setGuests(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={input + " pr-12"}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                명
              </span>
            </div>
          </div>

          {/* 주차 수 */}
          <div>
            <label className={label}>주차 수</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={parking || ""}
                onChange={(e) => setParking(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={input + " pr-12"}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                대
              </span>
            </div>
          </div>

          {/* 교통편 */}
          <div>
            <label className={label}>교통편</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_META.map((t) => {
                const active = transport.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTransport(t.id)}
                    className={
                      "inline-flex items-center gap-2 h-11 px-4 rounded-lg text-xs font-medium transition-colors " +
                      (active
                        ? "bg-mint/15 text-mint border border-mint/40 shadow-[0_0_20px_-6px_rgba(0,255,225,0.4)]"
                        : "bg-white/[0.04] text-white/60 border border-white/10 hover:text-white hover:bg-white/[0.08]")
                    }
                    aria-pressed={active}
                  >
                    <TwEmoji emoji={t.icon} size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className={label}>메모</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="이 웨딩홀에 대한 메모를 남겨주세요..."
              className={textarea}
            />
          </div>
        </div>

        {/* ── Footer ────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02]">
          <button type="button" onClick={onClose} className={ghostBtn}>
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={primaryBtn}
          >
            {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
