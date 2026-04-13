import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!;
const DIRECTIONS_URL =
  "https://maps.apigw.ntruss.com/map-direction/v1/driving";

interface Waypoint {
  lat: number;
  lng: number;
}

/**
 * POST /api/naver/directions
 * Body: { waypoints: Waypoint[] }  (min 2 — start + goal; extras become via points)
 *
 * Naver Directions 5 format:
 *   start=lng,lat  goal=lng,lat  waypoints=lng,lat|lng,lat|...
 * Note: Naver uses lng,lat order!
 *
 * Returns a simplified summary + path for map rendering.
 */
export async function POST(req: NextRequest) {
  try {
    const { waypoints } = (await req.json()) as { waypoints?: Waypoint[] };

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        { error: "최소 2개 지점이 필요합니다." },
        { status: 400 }
      );
    }

    const start = waypoints[0];
    const goal = waypoints[waypoints.length - 1];
    const vias = waypoints.slice(1, -1);

    const params = new URLSearchParams({
      start: `${start.lng},${start.lat}`,
      goal: `${goal.lng},${goal.lat}`,
    });
    if (vias.length > 0) {
      params.set(
        "waypoints",
        vias.map((w) => `${w.lng},${w.lat}`).join("|")
      );
    }

    const url = `${DIRECTIONS_URL}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Naver Directions error:", res.status, text);
      return NextResponse.json(
        { error: `경로 계산 실패 (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { error: data.message || "경로를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const route = data.route?.traoptimal?.[0];
    if (!route) {
      return NextResponse.json(
        { error: "경로 결과가 없습니다." },
        { status: 404 }
      );
    }

    // Flatten the path coordinates for polyline rendering.
    // Each section has a `coords` array of [lng, lat] pairs.
    const path: [number, number][] = [];
    for (const section of route.section || []) {
      for (const coord of section.coords || []) {
        path.push([coord[1], coord[0]]); // Convert [lng,lat] → [lat,lng] for our frontend
      }
    }

    // Per-section summaries (distance + duration between consecutive waypoints)
    const sections = (route.section || []).map(
      (s: { distance: number; duration: number; name: string }) => ({
        distance: s.distance, // meters
        duration: s.duration, // ms
        name: s.name || "",
      })
    );

    return NextResponse.json({
      totalDistance: route.summary.distance, // meters
      totalDuration: route.summary.duration, // ms
      sections,
      path,
    });
  } catch (e: unknown) {
    console.error("POST /api/naver/directions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
