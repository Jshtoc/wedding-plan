import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tmap/transit
 * Body: { waypoints: [{lat, lng}, {lat, lng}] }
 *
 * T맵 대중교통 API 프록시. 출발지→도착지 단일 구간의 최적 대중교통 경로를
 * 조회하고 Naver Directions 응답과 비슷한 `{ totalDuration, totalDistance }`
 * 형태로 반환한다. 단위는 ms / m (totalTime은 초 단위라 곱해준다).
 *
 * 추가 필드:
 *   - walkTime (ms), transferCount (환승 횟수), fare (성인 요금, 원)
 *
 * SK TMap 대중교통 API
 *   Endpoint: https://apis.openapi.sk.com/transit/routes  (POST)
 *   Auth:     appKey 헤더
 *   Key env:  TMAP_APP_KEY
 */

const APP_KEY = process.env.TMAP_APP_KEY!;
const ENDPOINT = "https://apis.openapi.sk.com/transit/routes";

interface Waypoint {
  lat: number;
  lng: number;
}

interface Itinerary {
  totalTime?: number; // seconds
  totalDistance?: number; // meters
  totalWalkTime?: number; // seconds
  transferCount?: number;
  totalFare?: { regular?: { totalFare?: number } };
}

interface TransitResponse {
  result?: { status?: number; message?: string };
  metaData?: {
    plan?: {
      itineraries?: Itinerary[];
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!APP_KEY) {
      return NextResponse.json(
        { error: "TMAP_APP_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { waypoints } = (await req.json()) as { waypoints?: Waypoint[] };
    if (!Array.isArray(waypoints) || waypoints.length !== 2) {
      return NextResponse.json(
        { error: "출발지·도착지 2개 좌표가 필요합니다." },
        { status: 400 }
      );
    }
    const [from, to] = waypoints;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        appKey: APP_KEY,
        Accept: "application/json",
      },
      body: JSON.stringify({
        startX: String(from.lng),
        startY: String(from.lat),
        endX: String(to.lng),
        endY: String(to.lat),
        count: 1,
        lang: 0,
        format: "json",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("TMap transit error:", res.status, text);
      return NextResponse.json(
        { error: `TMap 대중교통 API 실패 (${res.status})` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as TransitResponse;
    // 대중교통 경로가 없을 때 TMap은 result.status=11 (동일 출발/도착 등)을
    // 포함한 에러 구조로 응답한다.
    const it = data.metaData?.plan?.itineraries?.[0];
    if (!it) {
      const msg = data.result?.message || "대중교통 경로를 찾지 못했습니다.";
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    return NextResponse.json({
      totalDistance: it.totalDistance ?? 0,
      totalDuration: (it.totalTime ?? 0) * 1000, // ms (Naver와 통일)
      walkTime: (it.totalWalkTime ?? 0) * 1000,
      transferCount: it.transferCount ?? 0,
      fare: it.totalFare?.regular?.totalFare ?? 0,
    });
  } catch (e: unknown) {
    console.error("POST /api/tmap/transit error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
