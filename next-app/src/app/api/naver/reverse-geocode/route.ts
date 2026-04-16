import { NextRequest, NextResponse } from "next/server";

import { findLawdCd } from "@/data/lawdCodes";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!;
const REVERSE_GEOCODE_URL =
  "https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc";

/**
 * POST /api/naver/reverse-geocode
 * Body: { lat: number, lng: number }
 *
 * Used by the "현재 위치로 설정" flow — Browser geolocation returns
 * coords, we turn them into a human-readable address using Naver's
 * reverse geocoding. Response mirrors `AddressResult` from the forward
 * geocode route so the same consumer can plug it in.
 */
export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = (await req.json()) as {
      lat?: number;
      lng?: number;
    };
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "lat / lng 좌표가 필요합니다." },
        { status: 400 }
      );
    }

    // `coords` param is `lng,lat` (Naver convention) and we ask for
    // the full hierarchy in Korean — road name + legal district + admin.
    const params = new URLSearchParams({
      coords: `${lng},${lat}`,
      output: "json",
      orders: "roadaddr,addr,admcode,legalcode",
    });

    const res = await fetch(`${REVERSE_GEOCODE_URL}?${params.toString()}`, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Naver reverse-geocode error:", res.status, text);
      return NextResponse.json(
        { error: `역지오코딩 실패 (${res.status})` },
        { status: 502 }
      );
    }

    interface Region {
      area0?: { name?: string };
      area1?: { name?: string };
      area2?: { name?: string };
      area3?: { name?: string };
      area4?: { name?: string };
    }
    interface RoadLand {
      name?: string;
      number1?: string;
      number2?: string;
      addition0?: { value?: string };
    }
    interface Result {
      name: string; // "roadaddr" | "addr" | "admcode" | "legalcode"
      code?: { id?: string };
      region?: Region;
      land?: RoadLand;
    }
    const data = (await res.json()) as { results?: Result[] };
    const results = data.results || [];
    if (results.length === 0) {
      return NextResponse.json(
        { error: "해당 좌표의 주소를 찾지 못했습니다." },
        { status: 404 }
      );
    }

    const roadaddr = results.find((r) => r.name === "roadaddr");
    const addr = results.find((r) => r.name === "addr");
    const any = roadaddr || addr || results[0];
    const region = any.region || {};
    const city = region.area1?.name || "";
    const district = region.area2?.name || "";
    const dong = region.area3?.name || "";

    // Build roadAddress from road land info when available.
    let roadAddress = "";
    if (roadaddr?.land) {
      const l = roadaddr.land;
      const base = `${region.area1?.name ?? ""} ${region.area2?.name ?? ""} ${
        l.name ?? ""
      } ${l.number1 ?? ""}${l.number2 ? `-${l.number2}` : ""}`
        .replace(/\s+/g, " ")
        .trim();
      const building = l.addition0?.value || "";
      roadAddress = building ? `${base} ${building}` : base;
    }
    // Build jibun from addr result when available.
    let jibunAddress = "";
    if (addr?.land) {
      const l = addr.land;
      const base = `${region.area1?.name ?? ""} ${region.area2?.name ?? ""} ${
        region.area3?.name ?? ""
      } ${l.number1 ?? ""}${l.number2 ? `-${l.number2}` : ""}`
        .replace(/\s+/g, " ")
        .trim();
      jibunAddress = base;
    }

    const lawdCd = findLawdCd(city, district);

    return NextResponse.json({
      lat,
      lng,
      roadAddress: roadAddress || jibunAddress || `${city} ${district} ${dong}`.trim(),
      jibunAddress,
      city,
      district,
      dong,
      lawdCd,
    });
  } catch (e: unknown) {
    console.error("POST /api/naver/reverse-geocode error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
