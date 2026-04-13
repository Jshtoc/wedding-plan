"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Complex } from "@/data/complexes";
import TwEmoji from "../ui/TwEmoji";

interface Props {
  complexes: Complex[];
}

interface GeoResult {
  id: number;
  lat: number;
  lng: number;
}

interface RouteResult {
  totalDistance: number; // meters
  totalDuration: number; // ms
  sections: { distance: number; duration: number; name: string }[];
  path: [number, number][]; // [lat, lng][]
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}분`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** Build a searchable address string from a Complex. */
function complexAddress(c: Complex): string {
  return [c.city, c.district, c.dong, c.name].filter(Boolean).join(" ");
}

const NAVER_SDK_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;

export default function HousingRouteSection({ complexes }: Props) {
  // ── Selection state ──────────────────────────
  const candidates = useMemo(
    () => complexes.filter((c) => c.isCandidate),
    [complexes]
  );
  const pool = candidates.length > 0 ? candidates : complexes;
  const [selected, setSelected] = useState<Set<number>>(() => {
    return new Set(pool.map((c) => c.id));
  });

  // Sync selection when complexes change
  useEffect(() => {
    const ids = pool.map((c) => c.id);
    setSelected(new Set(ids));
  }, [pool]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedComplexes = useMemo(
    () => pool.filter((c) => selected.has(c.id)),
    [pool, selected]
  );

  // ── Route calculation ────────────────────────
  const [computing, setComputing] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  // ── Map refs ─────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    if (mapInstance.current) return; // already inited

    mapInstance.current = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(37.5665, 126.978), // Seoul
      zoom: 12,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      mapDataControl: false,
      logoControl: true,
      logoControlOptions: { position: naver.maps.BOTTOM_LEFT },
    });
  }, []);

  useEffect(() => {
    if (sdkReady) initMap();
  }, [sdkReady, initMap]);

  // ── Draw markers + polyline ──────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !sdkReady) return;

    // Clear old markers + polyline
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (geoResults.length === 0) return;

    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(geoResults[0].lat, geoResults[0].lng),
      new naver.maps.LatLng(geoResults[0].lat, geoResults[0].lng)
    );

    geoResults.forEach((g, i) => {
      const pos = new naver.maps.LatLng(g.lat, g.lng);
      bounds.extend(pos);

      const c = selectedComplexes.find((x) => x.id === g.id);
      const label = c?.name || `${i + 1}`;

      const marker = new naver.maps.Marker({
        position: pos,
        map,
        icon: {
          content: `<div style="
            background:#00FFE1;color:#111;font-size:11px;font-weight:700;
            padding:4px 8px;border-radius:8px;white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,255,225,0.5);
            border:2px solid rgba(0,0,0,0.15);
          "><span style="margin-right:4px">${i + 1}</span>${label}</div>`,
          anchor: new naver.maps.Point(15, 15),
        },
      });
      markersRef.current.push(marker);
    });

    // Draw polyline if route path available
    if (routeResult?.path && routeResult.path.length > 0) {
      const pathLatLngs = routeResult.path.map(
        ([lat, lng]) => new naver.maps.LatLng(lat, lng)
      );
      polylineRef.current = new naver.maps.Polyline({
        map,
        path: pathLatLngs,
        strokeColor: "#00FFE1",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
    }

    map.fitBounds(bounds, 60);
  }, [geoResults, routeResult, sdkReady, selectedComplexes]);

  // ── Compute route handler ────────────────────
  const handleCompute = async () => {
    if (selectedComplexes.length < 2) {
      setRouteError("최소 2개 매물을 선택해주세요.");
      return;
    }

    setComputing(true);
    setRouteError(null);
    setRouteResult(null);
    setGeoResults([]);

    try {
      // 1. Geocode all selected complexes
      const geos: GeoResult[] = [];
      for (const c of selectedComplexes) {
        const addr = complexAddress(c);
        const res = await fetch("/api/naver/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: addr }),
        });
        const data = await res.json();
        if (!res.ok) {
          setRouteError(`"${c.name}" 주소 검색 실패: ${data.error}`);
          setComputing(false);
          return;
        }
        geos.push({ id: c.id, lat: data.lat, lng: data.lng });
      }
      setGeoResults(geos);

      // 2. Calculate route via Naver Directions 5
      const waypoints = geos.map((g) => ({ lat: g.lat, lng: g.lng }));
      const dirRes = await fetch("/api/naver/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints }),
      });
      const dirData = await dirRes.json();
      if (!dirRes.ok) {
        setRouteError(`경로 계산 실패: ${dirData.error}`);
        setComputing(false);
        return;
      }
      setRouteResult(dirData);
    } catch (e: unknown) {
      setRouteError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setComputing(false);
    }
  };

  // ── Render ───────────────────────────────────
  if (complexes.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-3xl p-12 sm:p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mint/10 border border-mint/25 mb-5 shadow-[0_0_32px_-10px_rgba(0,255,225,0.5)]">
          <TwEmoji emoji="🚗" size={32} />
        </div>
        <div className="text-base font-semibold text-white mb-2">
          등록된 매물이 없습니다
        </div>
        <div className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
          매물 탭에서 관심 단지를 먼저 등록하세요. 등록된 매물 중 후보로 체크한
          단지의 방문 경로를 자동으로 계산합니다.
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src={NAVER_SDK_URL} onReady={() => setSdkReady(true)} />

      <div className="space-y-6">
        {/* Map area */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div
            ref={mapRef}
            className="w-full h-[360px] sm:h-[420px] bg-[#0a1210]"
          />
        </div>

        {/* Selection + compute */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
                Route Planner
              </div>
              <div className="text-lg font-semibold text-white tracking-tight">
                방문 매물 선택
              </div>
            </div>
            <button
              type="button"
              onClick={handleCompute}
              disabled={computing || selected.size < 2}
              className="h-10 px-5 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
            >
              {computing ? "계산 중..." : "경로 계산"}
            </button>
          </div>

          {routeError && (
            <div className="mb-4 flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 px-3 py-2.5 rounded-lg">
              <TwEmoji
                emoji="⚠️"
                size={13}
                className="flex-shrink-0 mt-0.5"
              />
              <span className="leading-relaxed">{routeError}</span>
            </div>
          )}

          <div className="space-y-2">
            {pool.map((c) => {
              const checked = selected.has(c.id);
              const idx = selectedComplexes.findIndex((x) => x.id === c.id);
              return (
                <label
                  key={c.id}
                  className={
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border " +
                    (checked
                      ? "bg-mint/[0.08] border-mint/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10")
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="sr-only"
                  />
                  <span
                    className={
                      "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold " +
                      (checked
                        ? "bg-mint text-gray-900"
                        : "bg-white/[0.06] text-white/40 border border-white/10")
                    }
                  >
                    {checked ? idx + 1 : ""}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-white/40 truncate">
                      {[c.city, c.district, c.dong].filter(Boolean).join(" ")}
                    </div>
                  </div>
                  {c.salePrice > 0 && (
                    <div className="text-[11px] text-mint/80 tabular-nums flex-shrink-0">
                      {c.salePrice.toLocaleString()}만
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Route result timeline */}
        {routeResult && (
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-1">
                  Route Result
                </div>
                <div className="text-lg font-semibold text-white tracking-tight">
                  임장 동선
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                  Total
                </div>
                <div className="text-sm font-semibold text-mint">
                  {formatDistance(routeResult.totalDistance)} ·{" "}
                  {formatDuration(routeResult.totalDuration)}
                </div>
              </div>
            </div>

            <div className="space-y-0">
              {selectedComplexes.map((c, i) => {
                const section = routeResult.sections[i] ?? null;
                const isLast = i === selectedComplexes.length - 1;

                return (
                  <div key={c.id}>
                    {/* Stop */}
                    <div className="flex items-start gap-3 py-3">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-mint text-gray-900 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 min-h-6 bg-white/10 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="text-sm font-medium text-white">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5">
                          {[c.city, c.district, c.dong]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                      </div>
                    </div>

                    {/* Connector — driving info between stops */}
                    {section && !isLast && (
                      <div className="flex items-center gap-2 pl-3.5 py-1">
                        <div className="w-0.5 h-full bg-transparent" />
                        <div className="ml-7 flex items-center gap-2 text-[11px] text-white/50 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                          <TwEmoji emoji="🚗" size={11} />
                          <span className="tabular-nums">
                            {formatDistance(section.distance)}
                          </span>
                          <span className="text-white/30">·</span>
                          <span className="tabular-nums">
                            {formatDuration(section.duration)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
