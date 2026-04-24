"use client";

/**
 * 카카오 우편번호 서비스 기반 주소 검색 컴포넌트.
 *
 * - AddressSearchInput: 클릭 시 카카오 주소 검색 팝업을 열고,
 *   선택한 주소 + 좌표를 AddressResult로 반환합니다.
 * - 좌표는 /api/kakao/geocode 서버 프록시를 통해 추가 조회합니다.
 */

import { useCallback, useRef, useState } from "react";

export interface AddressResult {
  roadAddress: string;
  jibunAddress: string;
  lat?: number;
  lng?: number;
  city?: string;
  district?: string;
  dong?: string;
  lawdCd?: string;
}

// 카카오 우편번호 SDK 타입 (최소)
declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: KakaoPostcodeResult) => void;
        onclose?: () => void;
        width?: number;
        height?: number;
      }) => { open: () => void };
    };
  }
}

interface KakaoPostcodeResult {
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  bname: string;
  bcode: string;
}

const POSTCODE_SDK = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadPostcodeSDK(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.daum?.Postcode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SDK;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("카카오 주소 SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

const inputCls =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all";

interface Props {
  value: AddressResult | null;
  onChange: (v: AddressResult | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** 사용 안 함 (하위 호환 유지) */
  useRecents?: boolean;
  allowCurrentLocation?: boolean;
  initialQuery?: string;
}

export function AddressSearchInput({
  value,
  onChange,
  placeholder = "주소 검색",
  className = "",
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const openPostcode = useCallback(async () => {
    if (disabled || pendingRef.current) return;
    pendingRef.current = true;
    setError(null);
    try {
      await loadPostcodeSDK();
      const postcode = new window.daum!.Postcode({
        oncomplete: async (data: KakaoPostcodeResult) => {
          const road = data.roadAddress || "";
          const jibun = data.jibunAddress || "";
          const base: AddressResult = {
            roadAddress: road,
            jibunAddress: jibun,
            city: data.sido,
            district: data.sigungu,
            dong: data.bname,
            lawdCd: data.bcode?.slice(0, 8) || "",
          };
          onChange(base);
          // 좌표 추가 조회
          const query = road || jibun;
          if (!query) return;
          setLoading(true);
          try {
            const res = await fetch("/api/kakao/geocode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query }),
            });
            if (res.ok) {
              const geo = await res.json();
              onChange({
                ...base,
                lat: geo.lat,
                lng: geo.lng,
                city: geo.city || base.city,
                district: geo.district || base.district,
                dong: geo.dong || base.dong,
              });
            }
          } finally {
            setLoading(false);
          }
        },
        onclose: () => {
          pendingRef.current = false;
        },
      });
      postcode.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "주소 검색을 열 수 없습니다.");
      pendingRef.current = false;
    }
  }, [disabled, onChange]);

  const handleClear = () => {
    onChange(null);
    setError(null);
  };

  const displayText = value?.roadAddress || value?.jibunAddress || "";

  return (
    <div className={className}>
      {displayText ? (
        <div className="flex gap-2">
          <div className="flex-1 h-11 px-3.5 flex items-center rounded-lg bg-white/[0.04] border border-white/10">
            <span className="text-sm text-white/80 truncate">{displayText}</span>
          </div>
          <button
            type="button"
            onClick={openPostcode}
            disabled={disabled || loading}
            className="h-11 px-3.5 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? "조회 중..." : "변경"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-lg text-white/30 hover:text-red-300 bg-white/[0.04] border border-white/10 hover:border-red-400/30 transition-colors disabled:opacity-40"
            aria-label="주소 초기화"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPostcode}
          disabled={disabled || loading}
          className={inputCls + " text-left text-white/25 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-40"}
        >
          {loading ? "조회 중..." : placeholder}
        </button>
      )}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-300 px-1">{error}</p>
      )}
    </div>
  );
}
