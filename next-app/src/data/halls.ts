export interface WeddingHall {
  id: number;
  name: string;
  sub: string;
  price: number;
  priceLabel: string;
  priceText: string;
  priceLevel: "ok" | "warn" | "over";
  ktx: number;
  ktxText: string;
  ktxWarn?: boolean;
  parking: number;
  isBest?: boolean;
  bestLabel?: string;
  image: string;
  imageAlt: string;
  imageFallback: string;
  badges: { text: string; color: "gold" | "green" | "red" | "amber" | "gray" }[];
  infoGrid: { label: string; value: string; cols?: 3 }[];
  extraInfoGrid?: { label: string; value: string }[];
  calc: { title: string; rows: { label: string; value: string; isTotal?: boolean; bold?: string }[] };
  note: string;
  noteType?: "warn" | "danger";
}

export const halls: WeddingHall[] = [
  {
    id: 1,
    name: "제이오스티엘",
    sub: "서울 구로구 구로동 · 1호선 구로역 도보 2분",
    price: 1367,
    priceLabel: "180명 기준",
    priceText: "약 1,367만원",
    priceLevel: "ok",
    ktx: 5,
    ktxText: "서울역 → 1호선 직행 · 환승 없음 · 약 20분",
    parking: 3000,
    isBest: true,
    bestLabel: "★ 가격 최우선 추천",
    image: "https://dnna01d8m6k3w.cloudfront.net/partnerProfile/2207/202410/20241022/e4d8fa4e-0507-4293-bbfe-7a02cc64de96.jpg",
    imageAlt: "제이오스티엘 티파니홀",
    imageFallback: "🏛️",
    badges: [
      { text: "가격 1위", color: "gold" },
      { text: "KTX 접근성 ★★★★★", color: "green" },
      { text: "단독홀", color: "green" },
      { text: "보증 150명~", color: "gray" },
      { text: "주차 3,000대 무료", color: "gray" },
    ],
    infoGrid: [
      { label: "대관료 (꽃 포함)", value: "350만원~" },
      { label: "식대 (음주류 포함)", value: "5.5~5.8만원" },
      { label: "예식 간격", value: "60분 분리예식" },
    ],
    calc: {
      title: "📊 예상 견적 (180명 기준)",
      rows: [
        { label: "대관료", value: "350만원" },
        { label: "식대 (5.65만 × 180)", value: "1,017만원" },
        { label: "예상 합계", value: "약 1,367만원", isTotal: true },
      ],
    },
    note: "광주 하객분들이 서울역에서 1호선만 타면 구로역까지 바로 연결. 환승 없이 도보 2분 거리라 어르신도 편리. 단독홀로 프라이빗한 예식 가능. 홀 수용 최대 850명이라 여유 있음.",
  },
  {
    id: 2,
    name: "SW 컨벤션센터",
    sub: "서울 종로구 창신동 · 1·6호선 동묘앞역 6번 출구 도보 1분",
    price: 1390,
    priceLabel: "180명 기준",
    priceText: "약 1,390만원",
    priceLevel: "ok",
    ktx: 4,
    ktxText: "서울역 → 1호선 → 동묘앞역 · 환승 없음 · 약 25분",
    parking: 500,
    image: "https://dnna01d8m6k3w.cloudfront.net/partnerProfile/2163/202410/20241010/945004a7-0953-49a1-9a5e-9edeebcfb56c.png",
    imageAlt: "SW 컨벤션센터 그랜드볼룸",
    imageFallback: "🏙️",
    badges: [
      { text: "가격 2위", color: "green" },
      { text: "KTX 접근성 ★★★★", color: "green" },
      { text: "단독홀", color: "green" },
      { text: "90분 넉넉한 예식", color: "gray" },
      { text: "11층 스카이뷰", color: "gray" },
    ],
    infoGrid: [
      { label: "대관료 (꽃+연출 포함)", value: "300~500만원" },
      { label: "식대 (음주류 포함)", value: "5~6만원" },
      { label: "예식 간격", value: "90분 분리예식" },
    ],
    extraInfoGrid: [
      { label: "보증인원", value: "200~300명" },
      { label: "주차", value: "500대 / 90분 무료" },
    ],
    calc: {
      title: "📊 예상 견적 (180명 기준)",
      rows: [
        { label: "대관료 (꽃+연출 포함)", value: "400만원" },
        { label: "식대 (5.5만 × 180)", value: "990만원" },
        { label: "예상 합계", value: "약 1,390만원", isTotal: true },
      ],
    },
    note: "꽃장식·연출료가 대관료에 이미 포함되어 추가금 리스크 낮음. 11층 스카이 단독홀로 도심 뷰가 보임. 1997년부터 운영한 오랜 식장이라 진행이 안정적.",
  },
  {
    id: 3,
    name: "웨딩시티 신도림",
    sub: "서울 구로구 신도림테크노마트 8층 · 1·2호선 신도림역",
    price: 2375,
    priceLabel: "보증 250명 기준",
    priceText: "약 2,375만원↑",
    priceLevel: "warn",
    ktx: 5,
    ktxText: "서울역 → 1호선 신도림역 직행 · 약 15분 (최단)",
    parking: 2000,
    image: "https://cdn.prod.website-files.com/66a1eeaa00f1c86c3dbae974/69c25dc732ace8f1e25e17be_%EC%9B%A8%EB%94%A9%EC%8B%9C%ED%8B%B0%20%EC%8A%A4%ED%83%80%ED%8B%B0%EC%8A%A4%20%ED%99%80%EC%9D%B4%EB%AF%B8%EC%A7%8003.jpg",
    imageAlt: "웨딩시티 신도림 스타티스홀",
    imageFallback: "🌸",
    badges: [
      { text: "KTX 접근성 ★★★★★", color: "green" },
      { text: "토다이 뷔페 (음식 최고)", color: "green" },
      { text: "주차 2,000대", color: "gray" },
      { text: "보증인원 250명 주의", color: "red" },
    ],
    infoGrid: [
      { label: "대관료 (생화 포함)", value: "800만원~" },
      { label: "식대 (음주류 포함)", value: "63,000원~" },
      { label: "예식 간격", value: "70~80분" },
    ],
    calc: {
      title: "📊 예상 견적",
      rows: [
        { label: "대관료 (생화 포함)", value: "800만원" },
        { label: "식대 (6.3만 × 250명)", value: "1,575만원", bold: "250명" },
        { label: "예상 합계", value: "약 2,375만원", isTotal: true },
      ],
    },
    note: "⚠️ 최소 보증인원 250명 — 180명 참석해도 250인분 식대(1,575만원) 전액 납부 필요. 교통·음식 퀄리티는 최상이지만 예산 초과폭이 큼.",
    noteType: "danger",
  },
  {
    id: 4,
    name: "DMC 타워 웨딩",
    sub: "서울 마포구 상암동 · DMC역 (6호선+공항철도+경의중앙선)",
    price: 2134,
    priceLabel: "라피네홀 기준",
    priceText: "약 2,134만원",
    priceLevel: "warn",
    ktx: 5,
    ktxText: "서울역 → 공항철도 DMC역 직행 · 약 10분",
    parking: 500,
    image: "https://cdn.prod.website-files.com/66a1eeaa00f1c86c3dbae974/66f60cdffac1fc0d13ffda17_1339047902_img_6174_0_1726195665.avif",
    imageAlt: "DMC타워웨딩 펠리체홀",
    imageFallback: "✨",
    badges: [
      { text: "공항철도 서울역 직행 ★★★★★", color: "green" },
      { text: "트리플 역세권", color: "green" },
      { text: "홀 3종 선택", color: "gray" },
      { text: "식대 8.8만원 (고가)", color: "amber" },
    ],
    infoGrid: [
      { label: "라피네홀 대관료", value: "550만원~" },
      { label: "그랜드볼룸 대관료", value: "900만원~" },
    ],
    extraInfoGrid: [
      { label: "식대 (음주류 포함)", value: "88,000원" },
      { label: "보증인원", value: "100명~ (라피네)" },
      { label: "주차", value: "500대 2h 무료" },
    ],
    calc: {
      title: "📊 예상 견적 (라피네홀 · 180명)",
      rows: [
        { label: "대관료 (꽃 포함)", value: "550만원" },
        { label: "식대 (8.8만 × 180)", value: "1,584만원" },
        { label: "예상 합계", value: "약 2,134만원", isTotal: true },
      ],
    },
    note: "공항철도로 서울역에서 딱 한 정거장. 지방 하객 동선 최고. 펠리체홀(신관 밝은홀)·그랜드볼룸·라피네홀 3종 보유. 라피네홀은 150석이라 180명은 약간 빡빡할 수 있음.",
  },
  {
    id: 5,
    name: "더뉴컨벤션 웨딩",
    sub: "서울 강서구 내발산동 · 5호선 발산역 도보 3분",
    price: 2676,
    priceLabel: "르노브홀 기준",
    priceText: "약 2,676만원",
    priceLevel: "over",
    ktx: 3,
    ktxText: "서울역 → 5호선 환승 필요 · 약 40분 (비교적 불편)",
    ktxWarn: true,
    parking: 600,
    image: "https://cdn.prod.website-files.com/66a1eeaa00f1c86c3dbae974/68ec9f47955088aa287a2a25_b7a70fdd06035.avif",
    imageAlt: "더뉴컨벤션웨딩 르노브홀",
    imageFallback: "🌿",
    badges: [
      { text: "강서 유일 단독 웨딩 건물", color: "gray" },
      { text: "S자 버진로드 (르노브)", color: "gray" },
      { text: "크리스탈 샹들리에 (더뉴홀)", color: "gray" },
      { text: "KTX 접근성 ★★★", color: "amber" },
    ],
    infoGrid: [
      { label: "르노브홀 (1F) 대관료", value: "900만 + 연출 300만" },
      { label: "더뉴홀 (2F) 대관료", value: "1,100만 + 연출 300만" },
    ],
    extraInfoGrid: [
      { label: "식대 (음주류 포함)", value: "82,000원" },
      { label: "보증인원", value: "200명~" },
      { label: "주차", value: "600대 2h 무료" },
    ],
    calc: {
      title: "📊 예상 견적 (르노브홀 · 180명)",
      rows: [
        { label: "대관료 + 연출료", value: "1,200만원" },
        { label: "식대 (8.2만 × 180)", value: "1,476만원" },
        { label: "예상 합계", value: "약 2,676만원", isTotal: true },
      ],
    },
    note: "인테리어 퀄리티 평가 매우 높음. 르노브홀은 밝고 가든 느낌, 더뉴홀은 어두운 샹들리에 느낌. 웨딩홀 전용 단독 건물이라 쾌적. 단, 서울역에서 환승이 필요해 광주 하객 이동 다소 불편.",
  },
  {
    id: 6,
    name: "아만티호텔 서울",
    sub: "서울 마포구 서교동 (홍대) · 2호선 홍대입구역",
    price: 3160,
    priceLabel: "보증 300명 기준",
    priceText: "약 3,160만원↑↑",
    priceLevel: "over",
    ktx: 4,
    ktxText: "서울역 → 공항철도 홍대입구역 · 약 10분 (환승 없음)",
    ktxWarn: true,
    parking: 300,
    image: "https://dnna01d8m6k3w.cloudfront.net/partnerProfile/3506/202410/20241011/750423a6-9d0e-4cda-91a8-a30fd9e97bdd.jpg",
    imageAlt: "아만티호텔 웨딩홀",
    imageFallback: "🕊️",
    badges: [
      { text: "120분 단독홀 (가장 여유)", color: "gray" },
      { text: "유럽풍 채플홀", color: "gray" },
      { text: "호텔 서비스", color: "gray" },
      { text: "보증인원 300명 주의", color: "red" },
    ],
    infoGrid: [
      { label: "대관료 + 꽃장식", value: "400만 + 450만원" },
      { label: "식대 (음주류 포함)", value: "77,000원" },
      { label: "예식 간격", value: "120분 단독" },
    ],
    calc: {
      title: "📊 예상 견적",
      rows: [
        { label: "대관료 + 꽃장식", value: "850만원" },
        { label: "식대 (7.7만 × 300명)", value: "2,310만원", bold: "300명" },
        { label: "예상 합계", value: "약 3,160만원", isTotal: true },
      ],
    },
    note: "⚠️ 최소 보증인원 300명 — 180명 참석해도 300인분(2,310만원) 전액 납부. 대관료 자체는 싸지만 보증인원 때문에 총비용이 가장 비쌈. 120분 여유로운 예식은 최대 강점.",
    noteType: "danger",
  },
];

export interface RouteStop {
  type: "start" | "stop" | "end";
  number?: number;
  name: string;
  address: string;
  tip?: string;
  price?: string;
  priceLevel?: "ok" | "warn" | "over";
  tags?: string[];
  isBest?: boolean;
  bestLabel?: string;
}

export interface RouteDrive {
  text: string;
}

export type RouteItem =
  | { kind: "stop"; data: RouteStop }
  | { kind: "drive"; data: RouteDrive };

export const routeItems: RouteItem[] = [
  { kind: "stop", data: { type: "start", name: "목동 (출발)", address: "서울 양천구 목동", tip: "오전 10시 출발 권장 — 점심 전 3곳, 점심 후 3곳" } },
  { kind: "drive", data: { text: "🚗 약 10분 · 3km" } },
  { kind: "stop", data: { type: "stop", number: 1, name: "더뉴컨벤션 웨딩", address: "서울 강서구 강서로 385 (내발산동)", price: "2,676만", priceLevel: "over", tags: ["5호선 발산역 3분", "주차 600대", "르노브홀 / 더뉴홀"], tip: "목동에서 가장 가까움. 발산역 바로 앞." } },
  { kind: "drive", data: { text: "🚗 약 15분 · 8km" } },
  { kind: "stop", data: { type: "stop", number: 2, name: "웨딩시티 신도림", address: "서울 구로구 경인로 662 신도림테크노마트 8층", price: "2,375만", priceLevel: "warn", tags: ["1·2호선 신도림역", "주차 2,000대", "토다이 뷔페"], tip: "테크노마트 건물 8층. 주차 넉넉." } },
  { kind: "drive", data: { text: "🚗 약 8분 · 3km" } },
  { kind: "stop", data: { type: "stop", number: 3, name: "제이오스티엘", address: "서울 구로구 구로중앙로 152 (구로동)", price: "1,367만", priceLevel: "ok", tags: ["1호선 구로역 2분", "주차 3,000대", "단독홀"], isBest: true, bestLabel: "★ 가격 1위 추천", tip: "신도림에서 바로 옆. 같이 보기 좋은 위치." } },
  { kind: "drive", data: { text: "🚗 약 30분 · 16km" } },
  { kind: "stop", data: { type: "stop", number: 4, name: "SW 컨벤션센터", address: "서울 종로구 종로 300 (창신동)", price: "1,390만", priceLevel: "ok", tags: ["1·6호선 동묘앞역 1분", "주차 500대", "11층 스카이뷰"], tip: "이동이 가장 긴 구간. 점심 후 이동 추천." } },
  { kind: "drive", data: { text: "🚗 약 25분 · 14km" } },
  { kind: "stop", data: { type: "stop", number: 5, name: "DMC 타워 웨딩", address: "서울 마포구 성암로 189 (상암동)", price: "2,134만", priceLevel: "warn", tags: ["6호선·공항철도 DMC역", "주차 500대", "홀 3종"], tip: "동묘앞에서 서쪽으로 이동. 상암 DMC 단지 내." } },
  { kind: "drive", data: { text: "🚗 약 12분 · 5km" } },
  { kind: "stop", data: { type: "stop", number: 6, name: "아만티호텔 서울", address: "서울 마포구 월드컵북로 31 (서교동)", price: "3,160만", priceLevel: "over", tags: ["2호선 홍대입구역", "주차 300대", "120분 단독 채플"], tip: "DMC에서 가까움. 홍대 주변이라 투어 후 식사하기 좋음." } },
  { kind: "drive", data: { text: "🚗 약 15분 · 6km" } },
  { kind: "stop", data: { type: "end", name: "목동 복귀", address: "서울 양천구 목동", tip: "총 이동시간 약 2시간 · 투어 포함 약 5~6시간 예상" } },
];
