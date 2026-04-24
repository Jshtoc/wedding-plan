import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/kakao/geocode
 * Body: { query: string }
 * Proxies to Kakao Local API (주소 검색) and returns coordinate + region info.
 */
export async function POST(req: NextRequest) {
  const { query } = await req.json().catch(() => ({}));
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=1`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Kakao API 오류 (${res.status})` }, { status: 502 });
  }

  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) {
    return NextResponse.json({ error: "주소를 찾을 수 없습니다." }, { status: 404 });
  }

  const addr = doc.road_address ?? doc.address;
  return NextResponse.json({
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    city: addr?.region_1depth_name ?? "",
    district: addr?.region_2depth_name ?? "",
    dong: addr?.region_3depth_name ?? "",
  });
}
