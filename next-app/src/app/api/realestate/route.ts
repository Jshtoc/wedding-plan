import { NextRequest, NextResponse } from "next/server";

// Use the ENCODING key (already URL-encoded) to avoid double-encoding.
// data.go.kr expects the key as-is in the query string.
const SERVICE_KEY_ENCODED = encodeURIComponent(
  process.env.DATA_GO_KR_SERVICE_KEY || ""
);
const TRADE_URL =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
const RENT_URL =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

/**
 * POST /api/realestate
 * Body: { lawdCd: string, aptName?: string, area?: string }
 *
 * Fetches recent 12 months of 매매 + 전월세 data for the given
 * 법정동코드 (5-digit LAWD_CD), optionally filtered by apartment
 * name and area. Returns aggregated price summary.
 */
export async function POST(req: NextRequest) {
  try {
    const { lawdCd, aptName, area } = (await req.json()) as {
      lawdCd?: string;
      aptName?: string;
      area?: string;
    };

    if (!lawdCd || lawdCd.length < 5) {
      return NextResponse.json(
        { error: "법정동코드(LAWD_CD) 5자리가 필요합니다." },
        { status: 400 }
      );
    }

    const code = lawdCd.slice(0, 5);

    // Fetch recent 12 months in parallel
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    // Fetch trade + rent data for most recent 3 months (to limit API calls)
    const recentMonths = months.slice(0, 3);
    // Fetch all 12 months for peak/low calculation
    const allMonths = months;

    interface TradeItem {
      aptNm: string;
      excluUseAr: string; // 전용면적
      dealAmount: string; // 거래금액 (만원, 쉼표 포함)
      dealYear: string;
      dealMonth: string;
      dealDay: string;
    }

    interface RentItem {
      aptNm: string;
      excluUseAr: string;
      deposit: string; // 보증금 (만원)
      monthlyRent: string; // 월세
    }

    const fetchXml = async (
      baseUrl: string,
      dealYmd: string
    ): Promise<string> => {
      // Build URL manually — serviceKey must NOT be double-encoded.
      // data.go.kr expects the encoding key verbatim in the query string.
      const url =
        `${baseUrl}?serviceKey=${SERVICE_KEY_ENCODED}` +
        `&LAWD_CD=${code}` +
        `&DEAL_YMD=${dealYmd}` +
        `&pageNo=1` +
        `&numOfRows=1000`;
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        console.error(`data.go.kr ${res.status}:`, text.slice(0, 200));
      }
      return text;
    };

    // Simple XML value extractor (no parser dependency)
    const extractTag = (xml: string, tag: string): string => {
      const match = xml.match(
        new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([^\\]]*?)\\]\\]>|<${tag}>([^<]*)</${tag}>`)
      );
      return (match?.[1] ?? match?.[2] ?? "").trim();
    };

    const extractItems = <T>(
      xml: string,
      tags: string[]
    ): T[] => {
      const items: T[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(xml)) !== null) {
        const block = m[1];
        const obj: Record<string, string> = {};
        for (const tag of tags) {
          obj[tag] = extractTag(block, tag);
        }
        items.push(obj as T);
      }
      return items;
    };

    const tradeTags = [
      "aptNm",
      "excluUseAr",
      "dealAmount",
      "dealYear",
      "dealMonth",
      "dealDay",
    ];
    const rentTags = ["aptNm", "excluUseAr", "deposit", "monthlyRent"];

    // Fetch recent trades (3 months) + rents (3 months)
    const [tradeXmls, rentXmls] = await Promise.all([
      Promise.all(recentMonths.map((ym) => fetchXml(TRADE_URL, ym))),
      Promise.all(recentMonths.map((ym) => fetchXml(RENT_URL, ym))),
    ]);

    let allTrades: TradeItem[] = [];
    for (const xml of tradeXmls) {
      allTrades.push(...extractItems<TradeItem>(xml, tradeTags));
    }

    let allRents: RentItem[] = [];
    for (const xml of rentXmls) {
      allRents.push(...extractItems<RentItem>(xml, rentTags));
    }

    // Log unique apartment names found (for debugging name matching)
    const uniqueNames = [
      ...new Set(allTrades.map((t) => t.aptNm).filter(Boolean)),
    ];
    console.log(
      `[realestate] Found ${allTrades.length} trades, ${allRents.length} rents in LAWD_CD=${code}. Apt names sample:`,
      uniqueNames.slice(0, 10)
    );

    // Filter by apartment name — multi-strategy fuzzy matching.
    // API names often differ from Naver Geocoding names, e.g.:
    //   Naver: "방화3단지 아파트"  →  API: "방화청솔3단지아파트"
    // Strategy: extract number tokens ("3단지") and base name tokens
    // ("방화") and check if the API name contains ALL of them.
    if (aptName) {
      const keyword = aptName
        .replace(/\s/g, "")
        .replace(/아파트$/i, "")
        .toLowerCase();

      const matchName = (name: string) => {
        const n = name.replace(/\s/g, "").replace(/아파트$/i, "").toLowerCase();
        // Bidirectional contains
        if (n.includes(keyword) || keyword.includes(n)) return true;
        // Token-based: extract meaningful chunks (numbers + surrounding text)
        // e.g. "방화3단지" → tokens ["방화", "3단지"]
        const tokens = keyword.match(/[가-힣]+|\d+단지|\d+차|\d+/g) || [];
        if (tokens.length >= 2) {
          // All tokens must appear in the API name
          return tokens.every((t) => n.includes(t));
        }
        // Single token fallback — at least the longest token must match
        if (tokens.length === 1 && tokens[0].length >= 2) {
          return n.includes(tokens[0]);
        }
        return false;
      };

      allTrades = allTrades.filter((t) => matchName(t.aptNm));
      allRents = allRents.filter((t) => matchName(t.aptNm));

      console.log(
        `[realestate] After name filter "${aptName}": trades=${allTrades.length} rents=${allRents.length}`
      );
    }

    // Filter by area (fuzzy — round to nearest integer match)
    if (area) {
      const targetArea = parseFloat(area);
      if (targetArea > 0) {
        allTrades = allTrades.filter(
          (t) => Math.abs(parseFloat(t.excluUseAr) - targetArea) < 2
        );
        allRents = allRents.filter(
          (t) => Math.abs(parseFloat(t.excluUseAr) - targetArea) < 2
        );
      }
    }

    // Parse 거래금액 → number (만원)
    const parsePrice = (s: string): number =>
      parseInt(s.replace(/,/g, "").trim(), 10) || 0;

    // ── Group by 전용면적 (rounded) ──────────────────
    const areaKey = (raw: string) => Math.round(parseFloat(raw) || 0);

    // Collect unique areas
    const areaSet = new Set<number>();
    allTrades.forEach((t) => areaSet.add(areaKey(t.excluUseAr)));
    allRents.forEach((t) => areaSet.add(areaKey(t.excluUseAr)));
    const areas = [...areaSet].filter((a) => a > 0).sort((a, b) => a - b);

    // Fetch extra months (12 total) for peak/low
    let extraTrades: TradeItem[] = [];
    if (allMonths.length > recentMonths.length) {
      const extraMonths = allMonths.slice(recentMonths.length);
      const extraXmls = await Promise.all(
        extraMonths.map((ym) => fetchXml(TRADE_URL, ym))
      );
      for (const xml of extraXmls) {
        let items = extractItems<TradeItem>(xml, tradeTags);
        if (aptName) {
          // Reuse the same matchName logic from above
          const kw = aptName.replace(/\s/g, "").replace(/아파트$/i, "").toLowerCase();
          const tokens = kw.match(/[가-힣]+|\d+단지|\d+차|\d+/g) || [];
          items = items.filter((t) => {
            const n = t.aptNm.replace(/\s/g, "").replace(/아파트$/i, "").toLowerCase();
            if (n.includes(kw) || kw.includes(n)) return true;
            if (tokens.length >= 2) return tokens.every((tk) => n.includes(tk));
            if (tokens.length === 1 && tokens[0].length >= 2) return n.includes(tokens[0]);
            return false;
          });
        }
        extraTrades.push(...items);
      }
    }
    const allHistTrades = [...allTrades, ...extraTrades];

    // Build per-area price summary
    interface AreaSummary {
      area: number;
      lastTradePrice: number;
      jeonsePrice: number;
      peakPrice: number;
      lowPrice: number;
      tradeCount: number;
      rentCount: number;
    }

    const areaSummaries: AreaSummary[] = areas.map((a) => {
      const match = (raw: string) => Math.abs(areaKey(raw) - a) < 2;

      const trades = allTrades
        .filter((t) => match(t.excluUseAr))
        .map((t) => parsePrice(t.dealAmount))
        .filter((p) => p > 0)
        .sort((x, y) => y - x);

      const rents = allRents
        .filter((t) => match(t.excluUseAr))
        .map((t) => parsePrice(t.deposit))
        .filter((p) => p > 0)
        .sort((x, y) => y - x);

      const histPrices = allHistTrades
        .filter((t) => match(t.excluUseAr))
        .map((t) => parsePrice(t.dealAmount))
        .filter((p) => p > 0);

      return {
        area: a,
        lastTradePrice: trades[0] || 0,
        jeonsePrice: rents.length > 0 ? rents[Math.floor(rents.length / 2)] : 0,
        peakPrice: histPrices.length > 0 ? Math.max(...histPrices) : 0,
        lowPrice: histPrices.length > 0 ? Math.min(...histPrices) : 0,
        tradeCount: trades.length,
        rentCount: rents.length,
      };
    });

    const matchedName =
      allTrades[0]?.aptNm || allRents[0]?.aptNm || "";

    console.log(
      `[realestate] LAWD_CD=${code} apt="${aptName}" → ${areas.length} areas found:`,
      areaSummaries.map((s) => `${s.area}㎡(${s.tradeCount}건)`)
    );

    // If no results matched, return the full apartment name list
    // so the user can pick manually.
    const suggestions =
      areaSummaries.length === 0 ? uniqueNames.slice(0, 30) : [];

    return NextResponse.json({
      matchedName,
      areas: areaSummaries,
      suggestions,
    });
  } catch (e: unknown) {
    console.error("POST /api/realestate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
