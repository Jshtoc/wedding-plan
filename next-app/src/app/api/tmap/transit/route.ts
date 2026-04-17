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

// ⚠️ Next.js에서 `.env.local` 변경 후에는 dev 서버(`npm run dev`)를 반드시
// 다시 시작해야 이 값이 로드됩니다.
const APP_KEY = process.env.TMAP_APP_KEY;
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
      console.error(
        "TMAP_APP_KEY가 설정되지 않았습니다. .env.local에 추가 후 dev 서버를 재시작하세요."
      );
      return NextResponse.json(
        {
          error:
            "TMAP_APP_KEY가 설정되지 않았습니다. .env.local에 추가 후 'npm run dev'를 다시 시작해주세요.",
        },
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

    const body = {
      startX: String(from.lng),
      startY: String(from.lat),
      endX: String(to.lng),
      endY: String(to.lat),
      count: 1,
      lang: 0,
      format: "json",
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        appKey: APP_KEY,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    // TMap은 경로 없음/잘못된 좌표 등에 400/404를 돌려주면서도 JSON body에
    // 상세 메시지를 담는다. 본문을 먼저 파싱하고 그 내용을 그대로 전파한다.
    const rawText = await res.text();
    let data: TransitResponse & { error?: { message?: string } } | null = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      // non-JSON response (e.g. HTML 에러 페이지)
    }

    if (!res.ok) {
      const tmapMsg =
        (data as { error?: { message?: string } } | null)?.error?.message ||
        data?.result?.message ||
        rawText.slice(0, 200);
      console.error(
        "TMap transit API error:",
        res.status,
        tmapMsg,
        "request:",
        body
      );
      return NextResponse.json(
        { error: `TMap 대중교통 API 실패 (${res.status}) ${tmapMsg}` },
        { status: 502 }
      );
    }

    // 경로가 없을 때 TMap은 200 OK로 내려오면서 result.status에 에러코드를 둔다.
    const it = data?.metaData?.plan?.itineraries?.[0];
    if (!it) {
      const msg = data?.result?.message || "대중교통 경로를 찾지 못했습니다.";
      console.warn("TMap transit no route:", msg, "request:", body);
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
