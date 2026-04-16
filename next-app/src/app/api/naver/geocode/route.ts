import { NextRequest, NextResponse } from "next/server";

import { findLawdCd } from "@/data/lawdCodes";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!;
const GEOCODE_URL =
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

interface AddressElement {
  types: string[];
  longName: string;
  shortName: string;
  code?: string;
}

interface NaverAddress {
  x: string;
  y: string;
  roadAddress: string;
  jibunAddress: string;
  englishAddress?: string;
  addressElements?: AddressElement[];
}

/**
 * Naver Geocoding API를 한 번 호출. 실패 시 throw, 성공하면 배열 반환
 * (빈 배열일 수도 있음).
 */
async function geocodeOnce(query: string): Promise<NaverAddress[]> {
  const url = `${GEOCODE_URL}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
      "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Naver Geocode error:", res.status, text, "query:", query);
    throw new Error(`Geocoding 실패 (${res.status})`);
  }
  const data = (await res.json()) as { addresses?: NaverAddress[] };
  return data.addresses || [];
}

/**
 * 사용자가 입력한 query에서 변형(variants)을 생성. 네이버 Geocoding API는
 * 네이버 지도 앱보다 훨씬 엄격해서:
 *  - 지번동(xxx동) + 도로명(xxx로/길/대로)이 섞인 주소를 인식 못 함
 *  - "서울특별시" → "서울"처럼 시/도 prefix 생략도 종종 실패
 *  - 불필요한 공백·건물명 포함 시 실패
 *
 * 원본이 0건이면 아래 순서로 재시도한다:
 *  1. 원본 그대로
 *  2. "xxx동"을 제거 (도로명이 함께 있을 때만)
 *  3. "xxx번지"를 제거 (도로명이 함께 있을 때만)
 *  4. 시/도 prefix를 짧은 형태로 치환 (서울특별시 → 서울 등)
 *  5. 제일 뒤 토큰(건물명일 가능성) 제거
 */
function generateQueryVariants(raw: string): string[] {
  const q = raw.replace(/\s+/g, " ").trim();
  const variants: string[] = [q];

  const hasRoad = /[가-힣\d]+(?:로|길|대로)(?:\s|$)/.test(q);
  const hasDong = /[가-힣\d]+동(?:\s|$)/.test(q);

  // 2. 도로명과 지번동이 섞여 있으면 동을 제거
  if (hasRoad && hasDong) {
    const stripped = q.replace(/\s?[가-힣\d]+동(?=\s)/, "").replace(/\s+/g, " ").trim();
    if (stripped && stripped !== q) variants.push(stripped);
  }

  // 3. 번지 제거 (도로명과 섞인 경우만)
  if (hasRoad && /\d+번지/.test(q)) {
    const stripped = q.replace(/\s?\d+번지/, "").replace(/\s+/g, " ").trim();
    if (stripped && stripped !== q) variants.push(stripped);
  }

  // 4. 광역시/특별시 prefix 축약 — 동일 주소를 짧게 표현한 대체안
  const shortened = q
    .replace(/^서울특별시\s/, "서울 ")
    .replace(/^부산광역시\s/, "부산 ")
    .replace(/^대구광역시\s/, "대구 ")
    .replace(/^인천광역시\s/, "인천 ")
    .replace(/^광주광역시\s/, "광주 ")
    .replace(/^대전광역시\s/, "대전 ")
    .replace(/^울산광역시\s/, "울산 ")
    .replace(/^세종특별자치시\s/, "세종 ")
    .replace(/^제주특별자치도\s/, "제주 ");
  if (shortened && shortened !== q) variants.push(shortened);

  // 5. 마지막 토큰 제거(건물명/랜드마크 가능성) — 공백이 있을 때만
  const tokens = q.split(/\s+/);
  if (tokens.length >= 3) {
    const dropped = tokens.slice(0, -1).join(" ");
    if (dropped && dropped !== q) variants.push(dropped);
  }

  // 중복 제거하고 원본 우선순위 유지
  return Array.from(new Set(variants));
}

/**
 * POST /api/naver/geocode
 * Body: { query: string }   (e.g. "서울 강남구 개포동 디에이치퍼스티어")
 * Returns:
 *   {
 *     addresses: AddressResult[],  // all candidates (Naver returns up to ~5)
 *     // First-result shortcuts kept for callers that only need the top match.
 *     lat, lng, roadAddress, jibunAddress, city, district, dong, lawdCd
 *   }
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

    // 변형들을 순서대로 시도 — 첫 번째로 결과가 있는 걸 채택.
    const variants = generateQueryVariants(query.trim());
    let found: NaverAddress[] = [];
    let usedQuery = query.trim();
    for (const v of variants) {
      const result = await geocodeOnce(v);
      if (result.length > 0) {
        found = result;
        usedQuery = v;
        break;
      }
    }

    if (found.length === 0) {
      return NextResponse.json(
        {
          error:
            "주소를 찾을 수 없습니다. 도로명 또는 지번 형식으로 다시 시도해주세요.",
          addresses: [],
        },
        { status: 404 }
      );
    }

    const addresses = found.map((a) => {
      const els = a.addressElements || [];
      const find = (type: string) =>
        els.find((e) => e.types.includes(type))?.shortName || "";
      const cityName = find("SIDO");
      const districtName = find("SIGUGUN");
      const lawdCd = findLawdCd(cityName, districtName);
      return {
        lat: parseFloat(a.y),
        lng: parseFloat(a.x),
        roadAddress: a.roadAddress || "",
        jibunAddress: a.jibunAddress || "",
        city: cityName,
        district: districtName,
        dong: find("DONGMYUN") || find("RI"),
        lawdCd,
      };
    });

    const first = addresses[0];
    return NextResponse.json({
      addresses,
      lat: first.lat,
      lng: first.lng,
      roadAddress: first.roadAddress || usedQuery,
      jibunAddress: first.jibunAddress,
      city: first.city,
      district: first.district,
      dong: first.dong,
      lawdCd: first.lawdCd,
    });
  } catch (e: unknown) {
    console.error("POST /api/naver/geocode error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
