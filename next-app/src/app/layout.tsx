import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "웨딩홀 비교 리스트",
  description: "신랑 100명 (광주) + 신부 80명 (서울) · 예산 1,000만원",
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
