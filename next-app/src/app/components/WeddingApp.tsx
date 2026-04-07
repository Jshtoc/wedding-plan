"use client";

import { useState, useMemo } from "react";
import { halls, WeddingHall } from "@/data/halls";
import HallCard from "./HallCard";
import RouteTab from "./RouteTab";

type SortType = "default" | "price" | "ktx" | "parking";
type TabType = "list" | "route";

export default function WeddingApp() {
  const [sortType, setSortType] = useState<SortType>("default");
  const [activeTab, setActiveTab] = useState<TabType>("list");

  const sortedHalls = useMemo(() => {
    const sorted = [...halls];
    switch (sortType) {
      case "price":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "ktx":
        sorted.sort((a, b) => b.ktx - a.ktx);
        break;
      case "parking":
        sorted.sort((a, b) => b.parking - a.parking);
        break;
      default:
        sorted.sort((a, b) => a.price - b.price);
        break;
    }
    return sorted;
  }, [sortType]);

  const sortButtons: { type: SortType; label: string }[] = [
    { type: "default", label: "기본 정렬" },
    { type: "price", label: "가격 낮은순" },
    { type: "ktx", label: "KTX 접근성순" },
    { type: "parking", label: "주차 많은순" },
  ];

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header>
        <h1>💍 웨딩홀 비교 리스트</h1>
        <p>신랑 100명 (광주) + 신부 80명 (서울) · 예산 1,000만원</p>
      </header>

      <div className="tab-nav">
        <button
          className={`tab-btn${activeTab === "list" ? " active" : ""}`}
          onClick={() => switchTab("list")}
        >
          웨딩홀 리스트
        </button>
        <button
          className={`tab-btn${activeTab === "route" ? " active" : ""}`}
          onClick={() => switchTab("route")}
        >
          동선 (목동 출발)
        </button>
      </div>

      {activeTab === "list" && (
        <div>
          <div className="filter-wrap">
            {sortButtons.map((btn) => (
              <button
                key={btn.type}
                className={`filter-btn${sortType === btn.type ? " active" : ""}`}
                onClick={() => setSortType(btn.type)}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="summary">
            <div className="sum-item">
              <div className="sum-label">총 하객 수</div>
              <div className="sum-val">180명</div>
            </div>
            <div className="sum-item">
              <div className="sum-label">목표 예산</div>
              <div className="sum-val">~1,000만</div>
            </div>
            <div className="sum-item">
              <div className="sum-label">광주→서울역</div>
              <div className="sum-val">KTX 90분</div>
            </div>
          </div>

          <div className="cards">
            {sortedHalls.map((hall) => (
              <HallCard key={hall.id} hall={hall} />
            ))}
          </div>

          <div className="section-divider" style={{ margin: "8px 0" }}>
            <span>버스 대절 참고</span>
          </div>

          <div
            className="bus-section"
            style={{
              margin: "0 16px 16px",
              background: "var(--card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 16,
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}
            >
              🚌 광주→서울 버스 대절 예상비용
            </div>
            <div className="info-grid">
              <div className="info-cell">
                <div className="info-lbl">45인승 1대 왕복</div>
                <div className="info-val">80~100만원</div>
              </div>
              <div className="info-cell">
                <div className="info-lbl">필요 대수 (100명)</div>
                <div className="info-val">3대</div>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-cell">
                <div className="info-lbl">총 예상 비용</div>
                <div className="info-val" style={{ color: "var(--ink)" }}>
                  약 270~360만원
                </div>
              </div>
              <div className="info-cell">
                <div className="info-lbl">KTX 100명 왕복 비교</div>
                <div className="info-val" style={{ color: "var(--red)" }}>
                  약 780~920만원
                </div>
              </div>
            </div>
            <div className="note" style={{ marginTop: 8 }}>
              버스 대절이 KTX 단체 예약보다 약 500만원 이상 저렴. 어르신
              하객분들 직행 이동 편의성도 높음. 견적 비교: allbus.kr /
              callbus.com
            </div>
          </div>
        </div>
      )}

      {activeTab === "route" && <RouteTab />}

      <footer>
        ※ 모든 가격은 추산이며 시기·보증인원·프로모션에 따라 변동됩니다.
        <br />
        반드시 직접 투어 후 견적 확인 권장 💍
        <br />
        <br />
        업데이트: 2026년 4월
      </footer>
    </>
  );
}
