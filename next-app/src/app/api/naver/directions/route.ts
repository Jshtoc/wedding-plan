import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!;
const DIRECTIONS_URL =
  "https://maps.apigw.ntruss.com/map-direction/v1/driving";

interface Waypoint {
  lat: number;
  lng: number;
}

interface NaverLegRoute {
  summary?: {
    distance?: number;
    duration?: number;
    tollFare?: number;
    taxiFare?: number;
    fuelPrice?: number;
  };
  section?: { coords?: [number, number][] }[];
  path?: [number, number][];
}

interface NaverResponse {
  code: number;
  message?: string;
  route?: {
    traoptimal?: NaverLegRoute[];
  };
}

/**
 * Call Naver Directions 5 for a single A→B leg. Returns its summary +
 * path coords (converted to [lat, lng]). Per-leg calls are the only way
 * to get reliable distance/duration per segment — Naver's aggregated
 * `summary.waypoints[]` cumulative values turned out to be unreliable
 * (intermediate waypoints sometimes repeat the same cumulative value,
 * producing 0m/0min legs in the middle).
 */
interface LegOk {
  distance: number;
  duration: number;
  tollFare: number;
  fuelPrice: number;
  taxiFare: number;
  path: [number, number][];
}

async function fetchLeg(
  a: Waypoint,
  b: Waypoint
): Promise<LegOk | { error: string; status: number }> {
  // `option=trafast` asks Naver for the fastest route with real-time
  // traffic reflected. That matches what 임장 users want for today's
  // trip — the `traoptimal` default is a more "balanced" compromise.
  const params = new URLSearchParams({
    start: `${a.lng},${a.lat}`,
    goal: `${b.lng},${b.lat}`,
    option: "trafast",
  });
  const res = await fetch(`${DIRECTIONS_URL}?${params.toString()}`, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
      "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Naver Directions leg error:", res.status, text);
    return { error: `경로 계산 실패 (${res.status})`, status: 502 };
  }
  const data = (await res.json()) as NaverResponse & {
    route?: { trafast?: NaverLegRoute[]; traoptimal?: NaverLegRoute[] };
  };
  if (data.code !== 0) {
    return {
      error: data.message || "경로를 찾을 수 없습니다.",
      status: 400,
    };
  }
  // Prefer `trafast` (the option we requested); fall back to
  // `traoptimal` defensively in case Naver returns it instead.
  const route = data.route?.trafast?.[0] || data.route?.traoptimal?.[0];
  if (!route) return { error: "경로 결과가 없습니다.", status: 404 };

  const path: [number, number][] = [];
  // Naver returns the path either at `route.path` or split across
  // `route.section[].coords`. Prefer `path` when present.
  if (Array.isArray(route.path) && route.path.length > 0) {
    for (const [lng, lat] of route.path) path.push([lat, lng]);
  } else {
    for (const section of route.section || []) {
      for (const [lng, lat] of section.coords || []) path.push([lat, lng]);
    }
  }

  const s = route.summary ?? {};
  return {
    distance: s.distance ?? 0,
    duration: s.duration ?? 0,
    tollFare: s.tollFare ?? 0,
    fuelPrice: s.fuelPrice ?? 0,
    taxiFare: s.taxiFare ?? 0,
    path,
  };
}

/**
 * POST /api/naver/directions
 * Body: { waypoints: Waypoint[] }  (min 2)
 *
 * Runs one Directions 5 call per consecutive pair in parallel, then
 * stitches the results into a single summary + path.
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

    // Build leg pairs [A→B, B→C, C→D, ...] and fetch in parallel.
    const pairs: [Waypoint, Waypoint][] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      pairs.push([waypoints[i], waypoints[i + 1]]);
    }
    const legs = await Promise.all(pairs.map(([a, b]) => fetchLeg(a, b)));

    // Bail out with the first error encountered.
    for (const leg of legs) {
      if ("error" in leg) {
        return NextResponse.json({ error: leg.error }, { status: leg.status });
      }
    }
    const okLegs = legs as LegOk[];

    const sections = okLegs.map((l) => ({
      distance: l.distance,
      duration: l.duration,
      tollFare: l.tollFare,
      fuelPrice: l.fuelPrice,
      taxiFare: l.taxiFare,
      name: "",
    }));

    const totalDistance = okLegs.reduce((acc, l) => acc + l.distance, 0);
    const totalDuration = okLegs.reduce((acc, l) => acc + l.duration, 0);
    const totalTollFare = okLegs.reduce((acc, l) => acc + l.tollFare, 0);
    const totalFuelPrice = okLegs.reduce((acc, l) => acc + l.fuelPrice, 0);
    const totalTaxiFare = okLegs.reduce((acc, l) => acc + l.taxiFare, 0);

    // Concatenate per-leg paths into a single polyline. Drop the first
    // point of each subsequent leg to avoid duplicating the waypoint.
    const path: [number, number][] = [];
    okLegs.forEach((l, i) => {
      const pts = l.path;
      if (pts.length === 0) return;
      if (i === 0) path.push(...pts);
      else path.push(...pts.slice(1));
    });

    return NextResponse.json({
      totalDistance,
      totalDuration,
      totalTollFare,
      totalFuelPrice,
      totalTaxiFare,
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
