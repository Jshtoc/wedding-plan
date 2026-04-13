import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!;
const GEOCODE_URL =
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";

/**
 * POST /api/naver/geocode
 * Body: { query: string }   (e.g. "서울 강남구 개포동 디에이치퍼스티어")
 * Returns: { lat: number, lng: number, roadAddress: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "query가 필요합니다." },
        { status: 400 }
      );
    }

    const url = `${GEOCODE_URL}?query=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Naver Geocode error:", res.status, text);
      return NextResponse.json(
        { error: `Geocoding 실패 (${res.status})` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      addresses?: { x: string; y: string; roadAddress: string }[];
    };

    if (!data.addresses || data.addresses.length === 0) {
      return NextResponse.json(
        { error: "주소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const first = data.addresses[0];
    return NextResponse.json({
      lat: parseFloat(first.y),
      lng: parseFloat(first.x),
      roadAddress: first.roadAddress || query,
    });
  } catch (e: unknown) {
    console.error("POST /api/naver/geocode error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
