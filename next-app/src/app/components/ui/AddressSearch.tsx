"use client";

/**
 * Shared address search UI for consistent UX across the app.
 *
 * - `AddressSearchInput` — looks like a normal input; clicking it opens the
 *   search modal. When a value is selected it shows the roadAddress and
 *   offers a "변경" button. Use this wherever an address field would appear.
 * - `AddressSearchModal` — the popup containing the search box + result list.
 *   Not usually used directly; `AddressSearchInput` handles the open/close.
 *
 * Both render into a Naver-geocode-backed list. The picked result is passed
 * back as a structured `AddressResult` with lat/lng + city/district/dong +
 * lawdCd (법정동코드) so callers can drive downstream API calls (e.g. 실거래가).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TwEmoji from "./TwEmoji";

export interface AddressResult {
  lat: number;
  lng: number;
  roadAddress: string;
  jibunAddress: string;
  city: string;
  district: string;
  dong: string;
  lawdCd: string;
}

// ─────────────────────────────────────────────────────────────
// Recent searches (localStorage)
// ─────────────────────────────────────────────────────────────

const RECENTS_KEY = "wwp.address.recents";
const RECENTS_MAX = 8;

function loadRecents(): AddressResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as AddressResult[]) : [];
  } catch {
    return [];
  }
}

function saveRecents(list: AddressResult[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {
    // quota exceeded — ignore
  }
}

/**
 * Prepend `item` to recents, deduping by lat/lng (rounded to 6 decimals)
 * since the same roadAddress can come back with minor coordinate jitter.
 */
function pushRecent(item: AddressResult): AddressResult[] {
  const prev = loadRecents();
  const key = (a: AddressResult) =>
    `${a.lat.toFixed(6)},${a.lng.toFixed(6)}`;
  const itemKey = key(item);
  const filtered = prev.filter((p) => key(p) !== itemKey);
  const next = [item, ...filtered].slice(0, RECENTS_MAX);
  saveRecents(next);
  return next;
}

const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all";
const ghostBtn =
  "h-11 px-4 rounded-lg text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-40";

// ─────────────────────────────────────────────────────────────
// AddressSearchInput
// ─────────────────────────────────────────────────────────────

interface InputProps {
  value: AddressResult | null;
  onChange: (v: AddressResult | null) => void;
  placeholder?: string;
  className?: string;
  /**
   * Seed text for the modal's search box. Useful when the input starts
   * empty but we want to suggest a query (e.g. complex name).
   */
  initialQuery?: string;
  disabled?: boolean;
  /**
   * When true, the modal shows the "이전 검색지" list and every picked
   * address is saved to localStorage. Default: false. Enable only on the
   * 동선 planner — we don't want property-registration searches polluting
   * the list or exposing 매물 addresses in other contexts.
   */
  useRecents?: boolean;
  /**
   * When true, shows a 📍 button that grabs the browser's current
   * location and reverse-geocodes it to fill this field. Intended for
   * the 출발지 input — disabled by default because geolocation requires
   * HTTPS + user permission and isn't meaningful for non-start fields.
   */
  allowCurrentLocation?: boolean;
}

export function AddressSearchInput({
  value,
  onChange,
  placeholder = "주소 검색",
  className = "",
  initialQuery,
  disabled,
  useRecents = false,
  allowCurrentLocation = false,
}: InputProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const openModal = () => {
    if (disabled) return;
    setModalOpen(true);
  };

  /**
   * Grab the user's location via the Geolocation API and reverse-geocode
   * it through our own /api/naver/reverse-geocode proxy. Any failure
   * (permission denied, timeout, no address at those coords) surfaces a
   * short inline error instead of a native browser dialog.
   */
  const handleUseCurrent = () => {
    if (disabled || locating) return;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocateError("이 브라우저는 위치 접근을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/naver/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setLocateError(data.error || "위치 조회 실패");
            return;
          }
          const result: AddressResult = {
            lat: data.lat,
            lng: data.lng,
            roadAddress: data.roadAddress,
            jibunAddress: data.jibunAddress,
            city: data.city,
            district: data.district,
            dong: data.dong,
            lawdCd: data.lawdCd,
          };
          if (useRecents) pushRecent(result);
          onChange(result);
        } catch (e: unknown) {
          setLocateError(e instanceof Error ? e.message : "네트워크 오류");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 차단되어 있어요. 브라우저 설정에서 허용해주세요."
            : err.code === err.POSITION_UNAVAILABLE
            ? "현재 위치를 가져오지 못했어요."
            : err.code === err.TIMEOUT
            ? "위치 조회 시간이 초과됐어요."
            : "위치 조회 실패";
        setLocateError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  };

  return (
    <>
      <div className={"flex gap-2 " + className}>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className={
            input +
            " flex-1 text-left flex items-center gap-2 " +
            (value ? "text-white" : "text-white/40") +
            (disabled ? " opacity-50 cursor-not-allowed" : " cursor-pointer hover:border-white/20")
          }
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="flex-shrink-0 text-white/35"
            aria-hidden
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" strokeLinecap="round" />
          </svg>
          <span className="flex-1 truncate">
            {value ? value.roadAddress || value.jibunAddress : placeholder}
          </span>
        </button>
        {value ? (
          <button
            type="button"
            onClick={openModal}
            className={ghostBtn + " whitespace-nowrap"}
            disabled={disabled}
          >
            변경
          </button>
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="주소 초기화"
            disabled={disabled}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-colors disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
            </svg>
          </button>
        ) : null}
        {allowCurrentLocation && !value && (
          <button
            type="button"
            onClick={handleUseCurrent}
            disabled={disabled || locating}
            aria-label="현재 위치로 설정"
            title="현재 위치로 설정"
            className="h-11 w-11 flex items-center justify-center rounded-lg text-mint/70 hover:text-mint bg-mint/5 hover:bg-mint/10 border border-mint/20 hover:border-mint/35 transition-colors disabled:opacity-40"
          >
            {locating ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="2.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
              </svg>
            )}
          </button>
        )}
      </div>
      {locateError && (
        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-red-300/90">
          <TwEmoji emoji="⚠️" size={11} className="flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{locateError}</span>
        </div>
      )}

      {modalOpen && (
        <AddressSearchModal
          initialQuery={value?.roadAddress || initialQuery || ""}
          useRecents={useRecents}
          onClose={() => setModalOpen(false)}
          onSelect={(result) => {
            if (useRecents) pushRecent(result);
            onChange(result);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// AddressSearchModal
// ─────────────────────────────────────────────────────────────

interface ModalProps {
  initialQuery?: string;
  onClose: () => void;
  onSelect: (v: AddressResult) => void;
  /** When true, show the 이전 검색지 list below the search box. */
  useRecents?: boolean;
}

export function AddressSearchModal({
  initialQuery = "",
  onClose,
  onSelect,
  useRecents = false,
}: ModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recents, setRecents] = useState<AddressResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Portal target must be resolved on the client — SSR has no document.
  useEffect(() => {
    setMounted(true);
    if (useRecents) setRecents(loadRecents());
  }, [useRecents]);

  // Auto-focus on open, ESC to close, auto-search if seeded
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      setError("주소를 입력해주세요.");
      return;
    }
    setSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch("/api/naver/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "주소 검색 실패");
        setResults([]);
        return;
      }
      const list: AddressResult[] = Array.isArray(data.addresses)
        ? data.addresses
        : [];
      setResults(list);
      if (list.length === 0) setError("검색 결과가 없습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Render into document.body so no ancestor's `backdrop-filter` /
  // `transform` / `filter` can turn this into a containing block for
  // `position: fixed` — that would trap the modal inside its parent
  // (see https://developer.mozilla.org/en-US/docs/Web/CSS/position#fixed).
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] max-h-[80vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
              Address Search
            </div>
            <h3 className="text-base font-semibold text-white">주소 검색</h3>
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

        {/* Search box */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="도로명 또는 건물명 입력 (예: 서울 강남구 테헤란로 152)"
              className={input + " flex-1"}
              disabled={searching}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="h-11 px-4 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {searching ? "..." : "검색"}
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 px-3 py-2 rounded-lg">
              <TwEmoji emoji="⚠️" size={13} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!hasSearched && !searching && recents.length === 0 && (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-mint/10 border border-mint/25 mb-3">
                <TwEmoji emoji="🔍" size={22} />
              </div>
              <div className="text-sm text-white/60 mb-1">주소를 검색해주세요</div>
              <div className="text-[11px] text-white/35 leading-relaxed">
                도로명, 지번, 건물명 모두 가능해요
              </div>
            </div>
          )}
          {!hasSearched && !searching && recents.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-1.5">
                  <TwEmoji emoji="🕘" size={12} />
                  <span className="text-[10px] font-semibold text-white/50 tracking-[0.15em] uppercase">
                    이전 검색지
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveRecents([]);
                    setRecents([]);
                  }}
                  className="text-[10px] text-white/35 hover:text-white/60 transition-colors"
                >
                  전체 삭제
                </button>
              </div>
              <ul className="divide-y divide-white/5">
                {recents.map((r, i) => (
                  <li key={i} className="relative group">
                    <button
                      type="button"
                      onClick={() => onSelect(r)}
                      className="w-full text-left pl-5 pr-12 py-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 flex-shrink-0 text-white/30 group-hover:text-mint transition-colors"
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="8" cy="7" r="2.8" />
                          <path
                            d="M8 14c-3-3.2-5-5.7-5-8a5 5 0 0 1 10 0c0 2.3-2 4.8-5 8z"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-white/85 truncate">
                            {r.roadAddress || r.jibunAddress}
                          </div>
                          {r.roadAddress && r.jibunAddress && (
                            <div className="text-[11px] text-white/40 truncate mt-0.5">
                              {r.jibunAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="이전 검색지에서 제거"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = recents.filter((_, j) => j !== i);
                        saveRecents(next);
                        setRecents(next);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searching && (
            <div className="p-10 text-center text-white/50">
              <div className="inline-flex items-center gap-2 text-[13px]">
                <svg className="animate-spin w-4 h-4 text-mint" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                검색 중...
              </div>
            </div>
          )}
          {!searching && results.length > 0 && (
            <ul className="divide-y divide-white/5">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onSelect(r)}
                    className="w-full text-left px-5 py-3.5 hover:bg-white/[0.04] transition-colors group"
                  >
                    {r.roadAddress && (
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold text-mint bg-mint/15 border border-mint/30 tracking-wider">
                          도로명
                        </span>
                        <span className="text-sm text-white group-hover:text-mint transition-colors">
                          {r.roadAddress}
                        </span>
                      </div>
                    )}
                    {r.jibunAddress && (
                      <div className="flex items-start gap-2 mt-1.5">
                        <span className="mt-0.5 flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium text-white/50 bg-white/[0.05] border border-white/10 tracking-wider">
                          지번
                        </span>
                        <span className="text-[12px] text-white/55">
                          {r.jibunAddress}
                        </span>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
