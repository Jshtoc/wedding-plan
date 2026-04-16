"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Complex } from "@/data/complexes";
import TwEmoji from "../ui/TwEmoji";
import { useLoading } from "../ui/LoadingOverlay";
import { useAlert } from "../ui/ConfirmModal";
import { AddressSearchInput, type AddressResult } from "../ui/AddressSearch";
import RouteHistoryModal from "../RouteHistoryModal";
import type { RoutePayload } from "@/data/routes";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  totalTollFare: number; // KRW
  totalFuelPrice: number; // KRW (Naver 추정)
  totalTaxiFare: number; // KRW (택시 이용 시 참고)
  sections: {
    distance: number;
    duration: number;
    tollFare: number;
    fuelPrice: number;
    taxiFare: number;
    name: string;
  }[];
  path: [number, number][]; // [lat, lng][]
}

/** "3,500원" 같은 한국식 통화 포맷. 0이면 "-". */
function formatKRW(v: number | undefined | null): string {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return "-";
  return `${Math.round(v).toLocaleString()}원`;
}

function formatDistance(meters: number | undefined | null): string {
  if (typeof meters !== "number" || !Number.isFinite(meters)) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.max(0, Math.round(meters))}m`;
}

function formatDuration(ms: number | undefined | null): string {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}분`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** HH:MM string → minutes since midnight. Invalid input → 0. */
function parseHHMM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return 0;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return h * 60 + mm;
}

/** Minutes since midnight (may exceed 1440) → "HH:MM" (24h). */
function formatHHMM(min: number): string {
  const clamped = Math.max(0, Math.round(min));
  const h = Math.floor(clamped / 60) % 24;
  const mm = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Haversine distance in meters between two lat/lng points. */
function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Nearest-neighbor TSP heuristic. Given a seed point (current location /
 * start) and a list of stops, returns stop ids in visit order. O(N²),
 * fine for N≤20. Not guaranteed optimal but close enough for 임장 routes.
 */
function nearestNeighborOrder(
  seed: { lat: number; lng: number } | null,
  stops: Complex[]
): number[] {
  const withCoords = stops.filter(
    (s): s is Complex & { lat: number; lng: number } =>
      s.lat != null && s.lng != null
  );
  if (withCoords.length <= 1) return stops.map((s) => s.id);

  const remaining = [...withCoords];
  const order: number[] = [];
  let current = seed;

  // Without a seed, start from the first stop.
  if (!current) {
    const first = remaining.shift()!;
    order.push(first.id);
    current = { lat: first.lat, lng: first.lng };
  }

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const d = haversineMeters(current, { lat: c.lat, lng: c.lng });
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    order.push(next.id);
    current = { lat: next.lat, lng: next.lng };
  }

  // Append any stops without coordinates at the end (preserve their order).
  const withoutCoords = stops.filter((s) => s.lat == null || s.lng == null);
  return [...order, ...withoutCoords.map((s) => s.id)];
}

/**
 * Naver Map web URL for directions. `mode` picks the travel mode — we
 * expose `car` (default) and `transit` (버스/지하철) so users can quickly
 * flip between driving and public transit views.
 */
function naverDirectionsUrl(
  from: { lat: number; lng: number; name: string },
  to: { lat: number; lng: number; name: string },
  mode: "car" | "transit" = "car"
): string {
  const s = `${from.lng},${from.lat},${encodeURIComponent(from.name || "출발")}`;
  const e = `${to.lng},${to.lat},${encodeURIComponent(to.name || "도착")}`;
  return `https://map.naver.com/p/directions/${s}/${e}/-/${mode}`;
}

/** Kakao Map web URL for driving directions. */
function kakaoDirectionsUrl(
  from: { lat: number; lng: number; name: string },
  to: { lat: number; lng: number; name: string }
): string {
  const qs = new URLSearchParams({
    sName: from.name || "출발",
    sX: String(from.lng),
    sY: String(from.lat),
    eName: to.name || "도착",
    eX: String(to.lng),
    eY: String(to.lat),
  });
  return `https://map.kakao.com/?${qs.toString()}`;
}

/** TMap URL scheme. On mobile web, opens the app if installed (no web fallback). */
function tmapDirectionsUrl(
  from: { lat: number; lng: number; name: string },
  to: { lat: number; lng: number; name: string }
): string {
  const qs = new URLSearchParams({
    startname: from.name || "출발",
    startx: String(from.lng),
    starty: String(from.lat),
    goalname: to.name || "도착",
    goalx: String(to.lng),
    goaly: String(to.lat),
  });
  return `tmap://route?${qs.toString()}`;
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
  // Ordered list of selected complex ids. Order defines visit sequence and
  // is mutated by drag-and-drop. Initialized with all pool ids in order.
  const [selected, setSelected] = useState<number[]>(() => pool.map((c) => c.id));

  // Sync selection when pool membership changes (add/remove), preserving
  // the user's current drag order for ids that still exist.
  useEffect(() => {
    const poolIds = pool.map((c) => c.id);
    const poolSet = new Set(poolIds);
    setSelected((prev) => {
      const prevSet = new Set(prev);
      const sameMembership =
        prev.length === poolIds.length && prev.every((id) => poolSet.has(id));
      if (sameMembership) return prev;
      const kept = prev.filter((id) => poolSet.has(id));
      const added = poolIds.filter((id) => !prevSet.has(id));
      return [...kept, ...added];
    });
  }, [pool]);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // Clear stale route when selection changes
    setRouteResult(null);
  };

  const byId = useMemo(() => {
    const m = new Map<number, Complex>();
    pool.forEach((c) => m.set(c.id, c));
    return m;
  }, [pool]);

  const selectedComplexes = useMemo(
    () => selected.map((id) => byId.get(id)).filter((c): c is Complex => !!c),
    [selected, byId]
  );

  const unselectedComplexes = useMemo(
    () => pool.filter((c) => !selected.includes(c.id)),
    [pool, selected]
  );

  // ── Drag-and-drop sensors ────────────────────
  // PointerSensor: mouse + pen. TouchSensor: touch with a tiny delay so that
  // scrolling doesn't get hijacked by a drag on mobile.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelected((prev) => {
      const oldIndex = prev.indexOf(active.id as number);
      const newIndex = prev.indexOf(over.id as number);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
    setRouteResult(null);
  };

  /**
   * Reorder selected stops with a nearest-neighbor heuristic from the
   * current start point (or the first selected stop if no start is set).
   * Runs on-device using haversine distance — good enough for N≤20 and
   * avoids burning Naver API quota on a preview optimization.
   */
  const handleAutoOptimize = () => {
    if (selectedComplexes.length < 2) return;
    const seed = start ? { lat: start.lat, lng: start.lng } : null;
    const order = nearestNeighborOrder(seed, selectedComplexes);
    setSelected(order);
    setRouteResult(null);
  };

  // ── Start / End points ──────────────────────
  // Single `AddressResult` per field — the AddressSearchInput owns the
  // modal/search UX so this section just reacts to the picked address.
  const [start, setStart] = useState<AddressResult | null>(null);
  const [end, setEnd] = useState<AddressResult | null>(null);
  const [endSameAsStart, setEndSameAsStart] = useState(false);

  // ── Time plan ────────────────────────────────
  // 출발 시각과 매물당 관람 시간을 받아 각 stop의 도착/출발 예상 시각을
  // 타임라인에 표시한다. 타임라인은 순수 계산(클라이언트)으로 충분하므로
  // 상태 변경 시 API 재호출 없음.
  const [departureTime, setDepartureTime] = useState("09:30");
  const [viewingMinutes, setViewingMinutes] = useState(30);
  /**
   * 중간 식사/휴식 시간(분). 0이면 비활성. 삽입 위치는 선택된 매물의
   * 중간 — 예: 4곳이면 2번째 매물 방문 후에 휴식이 들어간다.
   */
  const [mealMinutes, setMealMinutes] = useState(0);

  // ── Share link (URL hydration) ───────────────
  // 공유 링크로 들어온 경우 ?route=base64(JSON)을 파싱해서 폼 상태를
  // 복원한다. 외부 동기화가 아니라 "초기 seeding"이므로 mount 시 1회만
  // 실행. 매물 id가 현재 pool에 없으면 무시.
  const showAlert = useAlert();
  const hydratedFromUrlRef = useRef(false);
  useEffect(() => {
    if (hydratedFromUrlRef.current) return;
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("route");
    if (!raw) return;
    hydratedFromUrlRef.current = true;
    try {
      const decoded = decodeURIComponent(escape(atob(raw)));
      const payload = JSON.parse(decoded) as {
        start?: AddressResult | null;
        end?: AddressResult | null;
        endSame?: boolean;
        stops?: number[];
        dep?: string;
        view?: number;
        meal?: number;
      };
      if (payload.start) setStart(payload.start);
      if (payload.end) setEnd(payload.end);
      if (payload.endSame) setEndSameAsStart(true);
      if (typeof payload.dep === "string") setDepartureTime(payload.dep);
      if (typeof payload.view === "number") setViewingMinutes(payload.view);
      if (typeof payload.meal === "number") setMealMinutes(payload.meal);
      if (Array.isArray(payload.stops)) {
        // Keep only ids that exist in the current pool; preserve order.
        const poolIds = new Set(pool.map((c) => c.id));
        const ordered = payload.stops.filter((id) => poolIds.has(id));
        if (ordered.length > 0) setSelected(ordered);
      }
    } catch {
      // Malformed payload — ignore silently.
    }
    // pool is stable enough after first fetch; we only want to run this once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── History modal ────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);

  /**
   * Apply a saved route payload to all current state — hydrates the
   * planner UI from a history entry. We deliberately keep the stops
   * array as-is even if some ids no longer exist; the consumer-side
   * `byId` lookup will simply filter them out.
   */
  const applyPayload = (p: RoutePayload) => {
    setStart(p.start ?? null);
    setEnd(p.end ?? null);
    setEndSameAsStart(!!p.endSame);
    setDepartureTime(p.dep || "09:30");
    setViewingMinutes(typeof p.view === "number" ? p.view : 30);
    setMealMinutes(typeof p.meal === "number" ? p.meal : 0);
    if (Array.isArray(p.stops) && p.stops.length > 0) {
      const poolIds = new Set(pool.map((c) => c.id));
      const kept = p.stops.filter((id) => poolIds.has(id));
      setSelected(kept);
    }
    setRouteResult(null);
    setHistoryOpen(false);
  };

  /** Build the current planner state as a saveable payload. */
  const buildPayload = (): RoutePayload => ({
    start,
    end,
    endSame: endSameAsStart,
    stops: selected,
    dep: departureTime,
    view: viewingMinutes,
    meal: mealMinutes,
    result: routeResult
      ? {
          totalDistance: routeResult.totalDistance,
          totalDuration: routeResult.totalDuration,
          totalTollFare: routeResult.totalTollFare,
          totalFuelPrice: routeResult.totalFuelPrice,
          totalTaxiFare: routeResult.totalTaxiFare,
        }
      : undefined,
  });

  const handleShare = async () => {
    const payload = {
      start,
      end,
      endSame: endSameAsStart,
      stops: selected,
      dep: departureTime,
      view: viewingMinutes,
      meal: mealMinutes,
    };
    // btoa can't handle non-ASCII directly — round-trip through
    // encodeURIComponent/escape so Korean names survive.
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = new URL(window.location.href);
    url.searchParams.set("section", "housing-routes");
    url.searchParams.set("route", encoded);
    try {
      await navigator.clipboard.writeText(url.toString());
      await showAlert("공유 링크가 복사되었습니다.", {
        title: "공유 링크 복사",
        icon: "🔗",
      });
    } catch {
      // Fallback: show the URL so the user can copy manually.
      await showAlert(url.toString(), {
        title: "공유 링크 (수동 복사)",
        icon: "🔗",
      });
    }
  };

  const handleStartChange = (v: AddressResult | null) => {
    setStart(v);
    setRouteResult(null);
  };

  const handleEndChange = (v: AddressResult | null) => {
    setEnd(v);
    setRouteResult(null);
  };

  const toggleEndSameAsStart = () => {
    const next = !endSameAsStart;
    setEndSameAsStart(next);
    if (next) setEnd(start);
    setRouteResult(null);
  };

  // When start changes and endSameAsStart is on, sync
  useEffect(() => {
    if (endSameAsStart) setEnd(start);
  }, [start, endSameAsStart]);

  // ── Route calculation ────────────────────────
  const [computing, setComputing] = useState(false);
  const loading = useLoading();
  const [routeError, setRouteError] = useState<string | null>(null);
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
    if (start) {
      allPoints.push({ lat: start.lat, lng: start.lng, label: "출발", color: "#10b981" });
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
    if (end) {
      allPoints.push({ lat: end.lat, lng: end.lng, label: "도착", color: "#f87171" });
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
  }, [selectedComplexes, start, end, sdkReady]);

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

      // 2. Build waypoints: [start?] + complexes + [end?]
      const waypoints: { lat: number; lng: number }[] = [];
      if (start) waypoints.push({ lat: start.lat, lng: start.lng });
      waypoints.push(...geos.map((g) => ({ lat: g.lat, lng: g.lng })));
      if (end) waypoints.push({ lat: end.lat, lng: end.lng });

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

        {/* ── 1. 출발지 (0순위) ── */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[10px] font-bold text-emerald-300">
              0
            </span>
            <div className="text-[10px] font-semibold text-emerald-300/80 tracking-[0.2em] uppercase">
              출발지
            </div>
          </div>
          <AddressSearchInput
            value={start}
            onChange={handleStartChange}
            placeholder="출발지 주소 검색 (선택)"
            useRecents
            allowCurrentLocation
          />
        </div>

        {/* ── 2. 방문 매물 선택 (중간) ── */}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label="임장 히스토리 열기"
                title="히스토리"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-colors"
              >
                <TwEmoji emoji="📚" size={12} />
                <span className="hidden sm:inline">히스토리</span>
              </button>
              <button
                type="button"
                onClick={handleCompute}
                disabled={
                  computing ||
                  selected.length + (start ? 1 : 0) + (end ? 1 : 0) < 2
                }
                className="h-10 px-5 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
              >
                {computing ? "계산 중..." : "경로 계산"}
              </button>
            </div>
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

          {/* Time plan — 출발 시각 + 매물당 관람 시간 + 중간 휴식 */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-white/40 tracking-wider uppercase px-0.5">
                출발 시각
              </span>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-10 px-3 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums [color-scheme:dark]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-white/40 tracking-wider uppercase px-0.5">
                매물당 관람
              </span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5}
                  value={viewingMinutes || ""}
                  onChange={(e) =>
                    setViewingMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full h-10 px-3 pr-10 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                  분
                </span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-medium text-white/40 tracking-wider uppercase px-0.5 flex items-center gap-1">
                <TwEmoji emoji="🍴" size={10} />
                중간 식사
              </span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  value={mealMinutes || ""}
                  placeholder="0 = 없음"
                  onChange={(e) =>
                    setMealMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full h-10 px-3 pr-10 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
                  분
                </span>
              </div>
            </label>
          </div>

          {/* Selected — drag to reorder */}
          {selectedComplexes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-[10px] font-semibold text-white/50 tracking-[0.15em] uppercase">
                    방문 순서
                  </div>
                  <div className="text-[10px] text-white/30 truncate">
                    드래그로 순서 변경
                  </div>
                </div>
                {selectedComplexes.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleAutoOptimize}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold text-mint bg-mint/10 hover:bg-mint/15 border border-mint/25 hover:border-mint/40 transition-colors"
                  >
                    <TwEmoji emoji="🧭" size={11} />
                    최단 순서
                  </button>
                )}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selected}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedComplexes.map((c, idx) => (
                      <SortableStopRow
                        key={c.id}
                        complex={c}
                        index={idx}
                        onRemove={() => toggle(c.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Unselected — click to add */}
          {unselectedComplexes.length > 0 && (
            <div>
              {selectedComplexes.length > 0 && (
                <div className="text-[10px] font-semibold text-white/40 tracking-[0.15em] uppercase mb-2 px-1">
                  추가 가능한 매물
                </div>
              )}
              <div className="space-y-2">
                {unselectedComplexes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors border bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-left"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold bg-white/[0.06] text-white/30 border border-white/10">
                      +
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/80 truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-white/40 truncate">
                        {[c.city, c.district, c.dong].filter(Boolean).join(" ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.lat && c.lng && <TwEmoji emoji="📍" size={11} />}
                      {c.salePrice > 0 && (
                        <span className="text-[11px] text-white/50 tabular-nums">
                          {c.salePrice.toLocaleString()}만
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. 도착지 (마지막 순위) ── */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-[10px] font-bold text-red-300">
                ∞
              </span>
              <div className="text-[10px] font-semibold text-red-300/80 tracking-[0.2em] uppercase">
                도착지
              </div>
            </div>
            <label
              className={
                "inline-flex items-center gap-2 cursor-pointer select-none text-[11px] transition-colors " +
                (endSameAsStart
                  ? "text-mint"
                  : "text-white/60 hover:text-white/80")
              }
            >
              <input
                type="checkbox"
                checked={endSameAsStart}
                onChange={toggleEndSameAsStart}
                className="sr-only"
              />
              <span
                className={
                  "relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0 rounded-[5px] border transition-colors " +
                  (endSameAsStart
                    ? "bg-mint border-mint shadow-[0_0_10px_-2px_rgba(0,255,225,0.5)]"
                    : "bg-white/[0.06] border-white/25")
                }
              >
                <svg
                  className={
                    "w-3 h-3 text-gray-900 pointer-events-none transition-opacity " +
                    (endSameAsStart ? "opacity-100" : "opacity-0")
                  }
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.5L5 9L9.5 3.5" />
                </svg>
              </span>
              출발지와 동일
            </label>
          </div>
          <AddressSearchInput
            value={end}
            onChange={handleEndChange}
            placeholder="도착지 주소 검색 (선택)"
            disabled={endSameAsStart}
            useRecents
          />
        </div>

        {/* Route result timeline */}
        {routeResult && (
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase">
                    Route Result
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-mint bg-mint/10 border border-mint/25 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                    실시간 교통
                  </span>
                </div>
                <div className="text-lg font-semibold text-white tracking-tight">
                  임장 동선
                </div>
              </div>
              <div className="flex items-start gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    Total
                  </div>
                  <div className="text-sm font-semibold text-mint">
                    {formatDistance(routeResult.totalDistance)} ·{" "}
                    {formatDuration(routeResult.totalDuration)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="경로 공유 링크 복사"
                  title="공유 링크 복사"
                  className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-mint bg-mint/10 hover:bg-mint/15 border border-mint/25 hover:border-mint/40 transition-colors"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="4" cy="8" r="1.8" />
                    <circle cx="12" cy="4" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <path d="M5.5 7l5-2.2M5.5 9l5 2.2" />
                  </svg>
                  공유
                </button>
              </div>
            </div>

            {/* 예상 비용 */}
            {(routeResult.totalTollFare > 0 ||
              routeResult.totalFuelPrice > 0 ||
              routeResult.totalTaxiFare > 0) && (
              <div className="mb-5 grid grid-cols-3 gap-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TwEmoji emoji="⛽" size={11} />
                    <span className="text-[9px] font-semibold text-white/40 tracking-wider uppercase">
                      유류비
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-white tabular-nums">
                    {formatKRW(routeResult.totalFuelPrice)}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TwEmoji emoji="🛣️" size={11} />
                    <span className="text-[9px] font-semibold text-white/40 tracking-wider uppercase">
                      통행료
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-white tabular-nums">
                    {formatKRW(routeResult.totalTollFare)}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TwEmoji emoji="🚕" size={11} />
                    <span className="text-[9px] font-semibold text-white/40 tracking-wider uppercase">
                      택시 (참고)
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-white tabular-nums">
                    {formatKRW(routeResult.totalTaxiFare)}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-0">
              {/* Build the full stop list with lat/lng for navi deeplinks. */}
              {(() => {
                interface StopRow {
                  key: string;
                  name: string;
                  addr: string;
                  color: string;
                  badge: string;
                  lat: number;
                  lng: number;
                  isStartEnd: boolean;
                  arriveMin: number;
                  departMin: number;
                }
                const stops: StopRow[] = [];

                const baseMin = parseHHMM(departureTime);
                let cursor = baseMin;

                // 중간 식사 휴식: 선택된 매물의 가운데(올림) 직후에 삽입.
                //  예) 매물 4개 → 2번째 매물 후, 매물 3개 → 2번째 매물 후.
                const mealAfterComplexIdx =
                  mealMinutes > 0 && selectedComplexes.length > 0
                    ? Math.max(
                        0,
                        Math.ceil(selectedComplexes.length / 2) - 1
                      )
                    : -1;
                // 같은 인덱스를 stops[] 기준으로 변환해 렌더 시 매칭에 사용.
                const mealAfterStopIdx =
                  mealAfterComplexIdx >= 0
                    ? (start ? 1 : 0) + mealAfterComplexIdx
                    : -1;

                if (start) {
                  stops.push({
                    key: "start",
                    name: start.roadAddress,
                    addr: "",
                    color: "bg-emerald-500",
                    badge: "출발",
                    lat: start.lat,
                    lng: start.lng,
                    isStartEnd: true,
                    arriveMin: cursor,
                    departMin: cursor,
                  });
                }

                selectedComplexes.forEach((c, i) => {
                  // Section index for the leg INTO this stop.
                  const prevSectionIdx = stops.length - 1;
                  const prevSection =
                    prevSectionIdx >= 0
                      ? routeResult.sections[prevSectionIdx]
                      : null;
                  if (prevSection) {
                    cursor += Math.round(prevSection.duration / 60000);
                  }
                  const arriveMin = cursor;
                  cursor += viewingMinutes;
                  stops.push({
                    key: `c-${c.id}`,
                    name: c.name,
                    addr:
                      c.address ||
                      [c.city, c.district, c.dong].filter(Boolean).join(" "),
                    color: "bg-mint",
                    badge: String(i + 1),
                    lat: c.lat ?? 0,
                    lng: c.lng ?? 0,
                    isStartEnd: false,
                    arriveMin,
                    departMin: cursor,
                  });
                  // 관람 직후 식사 휴식 삽입 — 다음 leg 시각이 그만큼 밀림.
                  if (i === mealAfterComplexIdx) {
                    cursor += mealMinutes;
                  }
                });

                if (end) {
                  const prevSectionIdx = stops.length - 1;
                  const prevSection =
                    prevSectionIdx >= 0
                      ? routeResult.sections[prevSectionIdx]
                      : null;
                  if (prevSection) {
                    cursor += Math.round(prevSection.duration / 60000);
                  }
                  stops.push({
                    key: "end",
                    name: end.roadAddress,
                    addr: "",
                    color: "bg-red-400",
                    badge: "도착",
                    lat: end.lat,
                    lng: end.lng,
                    isStartEnd: true,
                    arriveMin: cursor,
                    departMin: cursor,
                  });
                }

                return stops.map((stop, i) => {
                  const section = routeResult.sections[i] ?? null;
                  const isLast = i === stops.length - 1;
                  const nextStop = isLast ? null : stops[i + 1];

                  return (
                    <div key={stop.key}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className={`${stop.isStartEnd ? "w-10 h-8 rounded-lg" : "w-8 h-8 rounded-full"} ${stop.color} text-gray-900 text-[10px] font-bold flex items-center justify-center`}>
                            {stop.badge}
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 min-h-6 bg-white/10 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white">
                              {stop.name}
                            </span>
                            {/* 도착 / 출발 시각 배지 */}
                            {stop.isStartEnd ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums text-emerald-300 bg-emerald-500/10 border border-emerald-400/20">
                                {formatHHMM(stop.arriveMin)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums text-white/70 bg-white/[0.05] border border-white/10">
                                <span className="text-mint">
                                  {formatHHMM(stop.arriveMin)}
                                </span>
                                {viewingMinutes > 0 && (
                                  <>
                                    <span className="text-white/30">→</span>
                                    <span className="text-white/60">
                                      {formatHHMM(stop.departMin)}
                                    </span>
                                  </>
                                )}
                              </span>
                            )}
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

                      {section && !isLast && nextStop && (
                        <div className="pl-3.5 py-1.5">
                          <div className="ml-7 flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 text-[11px] text-white/50 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                              <TwEmoji emoji="🚗" size={11} />
                              <span className="tabular-nums">
                                {formatDistance(section.distance)}
                              </span>
                              <span className="text-white/30">·</span>
                              <span className="tabular-nums">
                                {formatDuration(section.duration)}
                              </span>
                            </div>
                            {/* Navi app deeplinks — 모바일 브라우저에서 앱 설치 시 앱으로 전환 */}
                            {stop.lat !== 0 && nextStop.lat !== 0 && (
                              <NaviLinks
                                from={{ lat: stop.lat, lng: stop.lng, name: stop.name }}
                                to={{ lat: nextStop.lat, lng: nextStop.lng, name: nextStop.name }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                      {/* 중간 식사 휴식 — 지정된 매물 직후에 삽입 */}
                      {i === mealAfterStopIdx && mealMinutes > 0 && !isLast && (
                        <div className="pl-3.5 py-1">
                          <div className="ml-7 inline-flex items-center gap-2 text-[11px] font-medium text-amber-300/90 bg-amber-500/10 border border-amber-400/25 rounded-full px-3 py-1.5">
                            <TwEmoji emoji="🍴" size={11} />
                            <span>식사 · 휴식</span>
                            <span className="text-white/30">·</span>
                            <span className="tabular-nums">
                              {mealMinutes}분
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

      {historyOpen && (
        <RouteHistoryModal
          onClose={() => setHistoryOpen(false)}
          onLoad={applyPayload}
          currentPayload={buildPayload()}
        />
      )}
    </>
  );
}

/**
 * Deeplinks to 네이버지도 / 카카오맵 / 티맵 for a single leg. On mobile,
 * tapping opens the native app if installed (the OS handles the URL
 * scheme); otherwise falls back to the web map (Naver/Kakao) or does
 * nothing (TMap — scheme-only).
 */
function NaviLinks({
  from,
  to,
}: {
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
}) {
  const btn =
    "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border";
  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      <a
        href={naverDirectionsUrl(from, to, "car")}
        target="_blank"
        rel="noopener noreferrer"
        className={
          btn + " text-[#03C75A] bg-[#03C75A]/10 border-[#03C75A]/25 hover:bg-[#03C75A]/15"
        }
      >
        네이버
      </a>
      <a
        href={kakaoDirectionsUrl(from, to)}
        target="_blank"
        rel="noopener noreferrer"
        className={
          btn + " text-yellow-300 bg-yellow-400/10 border-yellow-400/25 hover:bg-yellow-400/15"
        }
      >
        카카오
      </a>
      <a
        href={tmapDirectionsUrl(from, to)}
        className={
          btn + " text-sky-300 bg-sky-400/10 border-sky-400/25 hover:bg-sky-400/15"
        }
      >
        티맵
      </a>
      <a
        href={naverDirectionsUrl(from, to, "transit")}
        target="_blank"
        rel="noopener noreferrer"
        title="네이버 지도 대중교통"
        className={
          btn + " text-violet-300 bg-violet-500/10 border-violet-400/25 hover:bg-violet-500/15"
        }
      >
        <TwEmoji emoji="🚊" size={10} />
        대중교통
      </a>
    </div>
  );
}

/**
 * Sortable row for a selected stop. Drag handle on the left (grip icon)
 * owns the listeners so the whole row isn't draggable — prevents accidental
 * drags when the user is just tapping the remove button.
 */
function SortableStopRow({
  complex,
  index,
  onRemove,
}: {
  complex: Complex;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: complex.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "flex items-center gap-3 p-3 rounded-xl border bg-mint/[0.08] border-mint/30 " +
        (isDragging ? "shadow-[0_8px_24px_-6px_rgba(0,255,225,0.35)]" : "")
      }
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="순서 변경을 위해 드래그"
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="5.5" cy="3.5" r="1.2" />
          <circle cx="10.5" cy="3.5" r="1.2" />
          <circle cx="5.5" cy="8" r="1.2" />
          <circle cx="10.5" cy="8" r="1.2" />
          <circle cx="5.5" cy="12.5" r="1.2" />
          <circle cx="10.5" cy="12.5" r="1.2" />
        </svg>
      </button>
      {/* Order badge */}
      <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold bg-mint text-gray-900">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {complex.name}
        </div>
        <div className="text-[11px] text-white/40 truncate">
          {[complex.city, complex.district, complex.dong]
            .filter(Boolean)
            .join(" ")}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {complex.lat && complex.lng && <TwEmoji emoji="📍" size={11} />}
        {complex.salePrice > 0 && (
          <span className="text-[11px] text-mint/80 tabular-nums">
            {complex.salePrice.toLocaleString()}만
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="매물 제거"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
          </svg>
        </button>
      </div>
    </div>
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
