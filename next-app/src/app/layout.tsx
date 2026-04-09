import type { Metadata } from "next";
import "./globals.css";

// On Vercel, VERCEL_PROJECT_PRODUCTION_URL gives the stable prod domain.
// Falls back to localhost for dev. metadataBase is required so Next.js
// resolves the opengraph-image.png / twitter-image.png convention files
// into absolute URLs that KakaoTalk, Twitter, etc. can fetch.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WWP - 우리들의 웨딩 플랜",
  description: "신랑 100명 (광주) + 신부 80명 (서울) · 예산 1,000만원",
  openGraph: {
    title: "WWP - 우리들의 웨딩 플랜",
    description: "신랑 100명 (광주) + 신부 80명 (서울) · 예산 1,000만원",
    type: "website",
    locale: "ko_KR",
    siteName: "WWP",
  },
  twitter: {
    card: "summary_large_image",
    title: "WWP - 우리들의 웨딩 플랜",
    description: "신랑 100명 (광주) + 신부 80명 (서울) · 예산 1,000만원",
  },
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body>
        {/* React 19 auto-hoists <link rel="stylesheet"> into <head>. */}
        <link
          rel="stylesheet"
          precedence="default"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
        {children}
      </body>
    </html>
  );
}
