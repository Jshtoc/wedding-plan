// Minimal HTML meta-tag extractor for URL preview (OG / Twitter / <title>).
// Regex-based so no HTML parser dependency. Handles the two common
// attribute orderings (property-before-content and content-before-property)
// for both `property="..."` (OpenGraph) and `name="..."` (Twitter, generic meta).

export interface OgPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
}

function extractMetaValue(html: string, key: string): string | undefined {
  // Four orderings × two quote styles — build robust patterns.
  const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attrs = ["property", "name"];
  for (const attr of attrs) {
    const patterns = [
      new RegExp(
        `<meta\\s[^>]*?${attr}\\s*=\\s*["']${escKey}["'][^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*>`,
        "i"
      ),
      new RegExp(
        `<meta\\s[^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*?${attr}\\s*=\\s*["']${escKey}["'][^>]*>`,
        "i"
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) return decodeEntities(m[1].trim());
    }
  }
  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return undefined;
  return decodeEntities(m[1].trim().replace(/\s+/g, " "));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function resolveUrl(raw: string | undefined, base: string): string | undefined {
  if (!raw) return undefined;
  try {
    return new URL(raw, base).toString();
  } catch {
    return undefined;
  }
}

export function parseOgPreview(html: string, baseUrl: string): OgPreview {
  const title =
    extractMetaValue(html, "og:title") ||
    extractMetaValue(html, "twitter:title") ||
    extractTitleTag(html);

  const description =
    extractMetaValue(html, "og:description") ||
    extractMetaValue(html, "twitter:description") ||
    extractMetaValue(html, "description");

  const rawImage =
    extractMetaValue(html, "og:image") ||
    extractMetaValue(html, "og:image:url") ||
    extractMetaValue(html, "twitter:image") ||
    extractMetaValue(html, "twitter:image:src");
  const image = resolveUrl(rawImage, baseUrl);

  const siteName = extractMetaValue(html, "og:site_name");

  return { title, description, image, siteName, url: baseUrl };
}
