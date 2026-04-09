import { NextRequest, NextResponse } from "next/server";
import { parseOgPreview } from "@/lib/ogParser";

/**
 * POST /api/fetch-preview
 * Body: { url: string }
 * Returns: { title?, description?, image?, siteName?, url? }
 *
 * Only fetches public http(s) URLs. Reads at most ~512KB of the response
 * and stops early once </head> is seen, since everything we care about
 * lives in <head>. Never saves or caches the fetched content — the client
 * gets only the parsed preview object, and decides what to persist.
 */

const MAX_BODY_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8000;

// Block localhost and private IP ranges to prevent SSRF abuse.
function isSafeUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return null;
  if (host === "0.0.0.0" || host === "::1" || host === "[::1]") return null;
  // IPv4 private ranges
  if (
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host) // link-local
  ) {
    return null;
  }
  return u;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const safeUrl = isSafeUrl(url.trim());
    if (!safeUrl) {
      return NextResponse.json(
        { error: "유효하지 않은 URL입니다 (http/https만 지원)." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(safeUrl.toString(), {
        headers: {
          "User-Agent":
            "WWP-personal-wedding-planner/1.0 (+link preview)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.5",
        },
        signal: controller.signal,
        redirect: "follow",
      });
    } catch (e: unknown) {
      clearTimeout(timer);
      const message =
        e instanceof Error
          ? e.name === "AbortError"
            ? "요청 시간 초과 (8초)"
            : e.message
          : "네트워크 오류";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: `페이지를 불러올 수 없습니다 (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      return NextResponse.json(
        { error: "HTML 페이지가 아닙니다." },
        { status: 415 }
      );
    }

    // Stream-read the body. Stop early after </head> so we don't slurp
    // huge product pages when all we need is meta tags.
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: "응답 본문을 읽을 수 없습니다." },
        { status: 502 }
      );
    }

    const decoder = new TextDecoder();
    let html = "";
    let totalBytes = 0;
    while (totalBytes < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    // Flush decoder and release the connection.
    html += decoder.decode();
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }

    const finalUrl = res.url || safeUrl.toString();
    const preview = parseOgPreview(html, finalUrl);
    return NextResponse.json(preview);
  } catch (e: unknown) {
    console.error("POST /api/fetch-preview error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
