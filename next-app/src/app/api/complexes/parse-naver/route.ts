import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/complexes/parse-naver
 * Body: { url: string }
 *
 * 네이버 부동산(new.land.naver.com) URL을 받아서 단지 기본 정보를
 * 자동으로 긁어오는 엔드포인트. 매물 등록 시 수기 입력 부담을 줄이는 게
 * 목적.
 *
 * 지원 URL:
 *  - https://new.land.naver.com/complexes/{complexNo}...
 *  - https://fin.land.naver.com/complexes/{complexNo}...
 *  - https://m.land.naver.com/complex/info/{complexNo}...
 *  - https://naver.me/XXXXXX (단축 URL — 리다이렉트 따라감)
 *
 * 전략:
 *  1. URL에서 complexNo 추출 (단축 URL은 먼저 리다이렉트 해제)
 *  2. 네이버의 내부 JSON API 호출 (공개 문서화된 것은 아니지만 SPA가
 *     사용하는 엔드포인트. User-Agent + Referer 필요)
 *  3. 실패 시 OG meta tag fallback — 최소한의 제목만이라도 채움
 */

function extractComplexNo(url: string): string | null {
  // complexes/123456 또는 complex/info/123456
  const re = /(?:complexes?\/(\d+)|complex\/info\/(\d+))/;
  const m = re.exec(url);
  if (!m) return null;
  return m[1] || m[2] || null;
}

async function resolveUrl(raw: string): Promise<string> {
  // naver.me 등 단축 URL은 HEAD 요청으로 Location 추적
  if (!/naver\.me|me2\./i.test(raw)) return raw;
  try {
    const res = await fetch(raw, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    return res.url || raw;
  } catch {
    return raw;
  }
}

interface NaverComplexDetail {
  complexName?: string;
  cortarAddress?: string;
  address?: string;
  detailAddress?: string;
  roadAddress?: string;
  roadAddressPrefix?: string;
  latitude?: number | string;
  longitude?: number | string;
  totalHouseholdCount?: number;
  useApproveYmd?: string;
  highFloor?: number;
  lowFloor?: number;
  totalDongCount?: number;
  minPrice?: number;
  maxPrice?: number;
  minLeasePrice?: number;
  maxLeasePrice?: number;
  pyoengNames?: string[];
}

interface NaverPyeongDetail {
  pyoeng?: string;
  supplyArea?: string;
  exclusiveArea?: string;
}

interface NaverComplexResponse {
  complexDetail?: NaverComplexDetail;
  complexPyeongDetailList?: NaverPyeongDetail[];
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "url이 필요합니다." }, { status: 400 });
    }

    const resolved = await resolveUrl(url.trim());
    const complexNo = extractComplexNo(resolved);
    if (!complexNo) {
      return NextResponse.json(
        {
          error:
            "네이버부동산 단지 URL 형식을 인식하지 못했습니다. (예: new.land.naver.com/complexes/123456)",
        },
        { status: 400 }
      );
    }

    // Naver's internal SPA API — no official docs, but stable for years.
    const apiUrl = `https://new.land.naver.com/api/complexes/${complexNo}?sameAddressGroup=false`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Referer: `https://new.land.naver.com/complexes/${complexNo}`,
      },
      cache: "no-store",
    });

    if (!apiRes.ok) {
      console.error(
        "Naver parse-naver API error:",
        apiRes.status,
        await apiRes.text().catch(() => "")
      );
      return NextResponse.json(
        { error: `네이버 API 호출 실패 (${apiRes.status})` },
        { status: 502 }
      );
    }

    const data = (await apiRes.json()) as NaverComplexResponse;
    const d = data.complexDetail;
    if (!d) {
      return NextResponse.json(
        { error: "단지 정보를 찾지 못했습니다." },
        { status: 404 }
      );
    }

    // cortarAddress is like "서울시 강남구 개포동" — split into parts.
    const addrParts = (d.cortarAddress || "").trim().split(/\s+/);
    const city = addrParts[0] || "";
    const district = addrParts[1] || "";
    const dong = addrParts[2] || "";

    // Full address (도로명 우선, 없으면 지번)
    const roadAddress = [d.roadAddressPrefix, d.roadAddress, d.detailAddress]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const fullAddress =
      roadAddress || [d.cortarAddress, d.address].filter(Boolean).join(" ").trim();

    // yearUnits — "1993 / 598" 형식 (기존 매물 등록 관례)
    const year = (d.useApproveYmd || "").substring(0, 4);
    const units = d.totalHouseholdCount || 0;
    const yearUnits = year && units ? `${year} / ${units}` : year || String(units || "");

    // 전용면적 (pyoengNames는 공급면적 기준 평수. 전용은 pyeong detail list에 있음)
    const pyeongList = data.complexPyeongDetailList || [];
    const exclusiveAreas = pyeongList
      .map((p) => parseFloat(p.exclusiveArea || "0"))
      .filter((n) => !isNaN(n) && n > 0);

    const lat =
      typeof d.latitude === "number"
        ? d.latitude
        : typeof d.latitude === "string"
        ? parseFloat(d.latitude)
        : undefined;
    const lng =
      typeof d.longitude === "number"
        ? d.longitude
        : typeof d.longitude === "string"
        ? parseFloat(d.longitude)
        : undefined;

    return NextResponse.json({
      complexNo,
      name: d.complexName || "",
      address: fullAddress,
      city,
      district,
      dong,
      yearUnits,
      lat,
      lng,
      // 네이버 시세 범위 (만원). 호가 최대를 salePrice 기본값으로 제안.
      salePriceMin: d.minPrice || 0,
      salePriceMax: d.maxPrice || 0,
      jeonseMin: d.minLeasePrice || 0,
      jeonseMax: d.maxLeasePrice || 0,
      exclusiveAreas,
      sourceUrl: `https://new.land.naver.com/complexes/${complexNo}`,
    });
  } catch (e: unknown) {
    console.error("POST /api/complexes/parse-naver error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
