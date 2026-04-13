"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Complex } from "@/data/complexes";
import TwEmoji from "../ui/TwEmoji";
import { useLoading } from "../ui/LoadingOverlay";

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

const NAVER_SDK_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;

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
    // Clear stale route when selection changes
    setRouteResult(null);
    setGeoResults([]);
  };

  const selectedComplexes = useMemo(
    () => pool.filter((c) => selected.has(c.id)),
    [pool, selected]
  );

  // ── Start / End points ──────────────────────
  const [startQuery, setStartQuery] = useState("");
  const [startCoord, setStartCoord] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [endQuery, setEndQuery] = useState("");
  const [endCoord, setEndCoord] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingEnd, setSearchingEnd] = useState(false);
  const [endSameAsStart, setEndSameAsStart] = useState(false);

  const geocodeAddress = async (
    query: string
  ): Promise<{ lat: number; lng: number; label: string } | null> => {
    if (!query.trim()) return null;
    const res = await fetch("/api/naver/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return { lat: data.lat, lng: data.lng, label: data.roadAddress || query };
  };

  const handleSearchStart = async () => {
    setSearchingStart(true);
    const result = await geocodeAddress(startQuery);
    if (result) {
      setStartCoord(result);
      setRouteResult(null);
    }
    setSearchingStart(false);
  };

  const toggleEndSameAsStart = () => {
    const next = !endSameAsStart;
    setEndSameAsStart(next);
    if (next && startCoord) {
      setEndCoord({ ...startCoord });
      setEndQuery(startCoord.label);
    } else if (next && !startCoord) {
      setEndCoord(null);
      setEndQuery("");
    }
    setRouteResult(null);
  };

  // When startCoord changes and endSameAsStart is on, sync
  useEffect(() => {
    if (endSameAsStart && startCoord) {
      setEndCoord({ ...startCoord });
      setEndQuery(startCoord.label);
    }
  }, [startCoord, endSameAsStart]);

  const handleSearchEnd = async () => {
    setSearchingEnd(true);
    const result = await geocodeAddress(endQuery);
    if (result) {
      setEndCoord(result);
      setRouteResult(null);
    }
    setSearchingEnd(false);
  };

  // ── Route calculation ────────────────────────
  const [computing, setComputing] = useState(false);
  const loading = useLoading();
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

  // ── Draw markers from stored coordinates (immediate, no API) ──
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !sdkReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Collect all points to show
    const allPoints: { lat: number; lng: number; label: string; color: string }[] = [];

    // Start point
    if (startCoord) {
      allPoints.push({ ...startCoord, label: "출발", color: "#10b981" });
    }

    // Complex markers
    const withCoords = selectedComplexes.filter(
      (c) => c.lat != null && c.lng != null
    );
    withCoords.forEach((c, i) => {
      allPoints.push({
        lat: c.lat!,
        lng: c.lng!,
        label: `${i + 1} ${c.name}`,
        color: "#00FFE1",
      });
    });

    // End point
    if (endCoord) {
      allPoints.push({ ...endCoord, label: "도착", color: "#f87171" });
    }

    if (allPoints.length === 0) return;

    const first = allPoints[0];
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(first.lat, first.lng),
      new naver.maps.LatLng(first.lat, first.lng)
    );

    allPoints.forEach((p) => {
      const pos = new naver.maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);

      const marker = new naver.maps.Marker({
        position: pos,
        map,
        icon: {
          content: `<div style="
            background:${p.color};color:#111;font-size:11px;font-weight:700;
            padding:4px 8px;border-radius:8px;white-space:nowrap;
            box-shadow:0 2px 8px ${p.color}80;
            border:2px solid rgba(0,0,0,0.15);
          ">${p.label}</div>`,
          anchor: new naver.maps.Point(15, 15),
        },
      });
      markersRef.current.push(marker);
    });

    map.fitBounds(bounds, 60);
  }, [selectedComplexes, startCoord, endCoord, sdkReady]);

  // ── Draw polyline when route is calculated ──────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !sdkReady) return;

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!routeResult?.path || routeResult.path.length === 0) return;

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
  }, [routeResult, sdkReady]);

  // ── Compute route handler ────────────────────
  const handleCompute = async () => {
    if (selectedComplexes.length === 0) {
      setRouteError("최소 1개 매물을 선택해주세요.");
      return;
    }

    setComputing(true);
    loading.show();
    setRouteError(null);
    setRouteResult(null);
    setGeoResults([]);

    try {
      // 1. Resolve coordinates for selected complexes
      const geos: GeoResult[] = [];
      for (const c of selectedComplexes) {
        if (c.lat && c.lng) {
          geos.push({ id: c.id, lat: c.lat, lng: c.lng });
        } else {
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
            loading.hide();
            return;
          }
          geos.push({ id: c.id, lat: data.lat, lng: data.lng });
        }
      }
      setGeoResults(geos);

      // 2. Build waypoints: [start?] + complexes + [end?]
      const waypoints: { lat: number; lng: number }[] = [];
      if (startCoord) waypoints.push({ lat: startCoord.lat, lng: startCoord.lng });
      waypoints.push(...geos.map((g) => ({ lat: g.lat, lng: g.lng })));
      if (endCoord) waypoints.push({ lat: endCoord.lat, lng: endCoord.lng });

      if (waypoints.length < 2) {
        setRouteError("경로 계산에는 최소 2개 지점이 필요합니다. 출발지/도착지를 설정하거나 매물을 더 선택해주세요.");
        setComputing(false);
        loading.hide();
        return;
      }
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
      loading.hide();
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

        {/* Start / End address inputs */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase mb-3">
            Start &amp; End
          </div>
          <div className="space-y-3">
            {/* 출발지 */}
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-9 h-11 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                출발
              </div>
              <input
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchStart();
                  }
                }}
                placeholder={startCoord ? startCoord.label : "출발지 주소 입력 (선택)"}
                className="flex-1 h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all"
                disabled={searchingStart}
              />
              <button
                type="button"
                onClick={handleSearchStart}
                disabled={searchingStart || !startQuery.trim()}
                className="h-11 px-4 rounded-lg text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-40"
              >
                {searchingStart ? "..." : "검색"}
              </button>
              {startCoord && (
                <button
                  type="button"
                  onClick={() => {
                    setStartCoord(null);
                    setStartQuery("");
                    setRouteResult(null);
                  }}
                  aria-label="출발지 초기화"
                  className="h-11 w-11 flex items-center justify-center rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"/></svg>
                </button>
              )}
            </div>
            {/* 도착지 */}
            <div>
              <label className="inline-flex items-center gap-2 mb-2 cursor-pointer select-none text-[11px] text-white/60 hover:text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={endSameAsStart}
                  onChange={toggleEndSameAsStart}
                  className="sr-only peer"
                />
                <span className="relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0">
                  <span className="absolute inset-0 rounded-[5px] border border-white/25 bg-white/[0.06] peer-checked:bg-mint peer-checked:border-mint transition-colors" />
                  <svg className="absolute w-3 h-3 text-gray-900 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5L5 9L9.5 3.5"/></svg>
                </span>
                출발지와 동일
              </label>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-9 h-11 rounded-lg bg-red-500/15 border border-red-400/30 flex items-center justify-center text-[10px] font-bold text-red-300">
                  도착
                </div>
                <input
                  value={endSameAsStart ? (startCoord?.label || "") : endQuery}
                  onChange={(e) => {
                    if (!endSameAsStart) setEndQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !endSameAsStart) {
                      e.preventDefault();
                      handleSearchEnd();
                    }
                  }}
                  placeholder={endCoord ? endCoord.label : "도착지 주소 입력 (선택)"}
                  className="flex-1 h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all disabled:opacity-50"
                  disabled={searchingEnd || endSameAsStart}
                />
                {!endSameAsStart && (
                  <>
                    <button
                      type="button"
                      onClick={handleSearchEnd}
                      disabled={searchingEnd || !endQuery.trim()}
                      className="h-11 px-4 rounded-lg text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-40"
                    >
                      {searchingEnd ? "..." : "검색"}
                    </button>
                    {endCoord && (
                      <button
                        type="button"
                        onClick={() => {
                          setEndCoord(null);
                          setEndQuery("");
                          setRouteResult(null);
                        }}
                        aria-label="도착지 초기화"
                        className="h-11 w-11 flex items-center justify-center rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"/></svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.lat && c.lng && (
                      <TwEmoji emoji="📍" size={11} />
                    )}
                    {c.salePrice > 0 && (
                      <span className="text-[11px] text-mint/80 tabular-nums">
                        {c.salePrice.toLocaleString()}만
                      </span>
                    )}
                  </div>
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
              {/* Build the full stop list: start? + complexes + end? */}
              {(() => {
                const stops: { key: string; name: string; addr: string; color: string; badge: string }[] = [];
                if (startCoord) stops.push({ key: "start", name: startCoord.label, addr: "", color: "bg-emerald-500", badge: "출발" });
                selectedComplexes.forEach((c, i) => {
                  stops.push({
                    key: `c-${c.id}`,
                    name: c.name,
                    addr: c.address || [c.city, c.district, c.dong].filter(Boolean).join(" "),
                    color: "bg-mint",
                    badge: String(i + 1),
                  });
                });
                if (endCoord) stops.push({ key: "end", name: endCoord.label, addr: "", color: "bg-red-400", badge: "도착" });

                return stops.map((stop, i) => {
                  const section = routeResult.sections[i] ?? null;
                  const isLast = i === stops.length - 1;
                  const isStartEnd = stop.key === "start" || stop.key === "end";

                  return (
                    <div key={stop.key}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className={`${isStartEnd ? "w-10 h-8 rounded-lg" : "w-8 h-8 rounded-full"} ${stop.color} text-gray-900 text-[10px] font-bold flex items-center justify-center`}>
                            {stop.badge}
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 min-h-6 bg-white/10 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-sm font-medium text-white">
                            {stop.name}
                          </div>
                          {stop.addr && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-white/40 truncate">
                                {stop.addr}
                              </span>
                              <CopyButton text={stop.addr} />
                            </div>
                          )}
                        </div>
                      </div>

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
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/** Tiny copy-to-clipboard button with checkmark feedback. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback — ignored
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="주소 복사"
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-mint hover:bg-mint/10 transition-colors"
    >
      {copied ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-mint"
        >
          <path d="M3 8.5 L6.5 12 L13 4" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="5" width="9" height="9" rx="1.5" />
          <path d="M3 11 V3 a1.5 1.5 0 0 1 1.5-1.5 H11" />
        </svg>
      )}
    </button>
  );
}
