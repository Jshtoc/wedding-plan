interface Props {
  emoji: string;
  size?: number;
  className?: string;
  alt?: string;
}

// Convert an emoji string to its Twemoji SVG filename (hex codepoint sequence)
function toCodePoint(emoji: string): string {
  // Per twemoji: strip FE0F variation selectors unless the sequence contains ZWJ
  const normalized = emoji.includes("\u200D")
    ? emoji
    : emoji.replace(/\uFE0F/g, "");
  const cps: string[] = [];
  for (const char of normalized) {
    const cp = char.codePointAt(0);
    if (cp !== undefined) cps.push(cp.toString(16));
  }
  return cps.join("-");
}

export default function TwEmoji({ emoji, size = 18, className, alt }: Props) {
  const code = toCodePoint(emoji);
  const src = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? emoji}
      width={size}
      height={size}
      className={`twemoji${className ? ` ${className}` : ""}`}
      draggable={false}
    />
  );
}
