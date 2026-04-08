"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { WeddingHall } from "@/data/halls";
import HallCard from "./HallCard";
import RouteTab from "./RouteTab";
import HallFormModal from "./HallFormModal";
import TwEmoji from "./ui/TwEmoji";

type SortType = "default" | "price" | "ktx" | "parking";
type TabType = "list" | "route";

export default function WeddingApp() {
  const [halls, setHalls] = useState<WeddingHall[]>([]);
  const [sortType, setSortType] = useState<SortType>("default");
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState<WeddingHall | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchHalls = useCallback(async () => {
    try {
      const res = await fetch("/api/halls");
      const data = await res.json();
      if (!res.ok) {
        const message =
          (data && typeof data === "object" && "error" in data
            ? String(data.error)
            : null) || `요청 실패 (HTTP ${res.status})`;
        setFetchError(message);
        setHalls([]);
      } else if (!Array.isArray(data)) {
        setFetchError("서버가 예상치 못한 응답을 반환했습니다.");
        setHalls([]);
      } else {
        setFetchError(null);
        setHalls(data);
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "네트워크 오류");
      setHalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

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
  }, [halls, sortType]);

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

  const handleEdit = (hall: WeddingHall) => {
    setEditingHall(hall);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/halls/${id}`, { method: "DELETE" });
    fetchHalls();
  };

  const handleAdd = () => {
    setEditingHall(null);
    setShowModal(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <header className="sticky top-0">
        <button
          onClick={handleLogout}
          title="로그아웃"
          className="absolute top-4 right-4 bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer"
        >
          로그아웃
        </button>
        <h1>
          <TwEmoji emoji="💍" size={20} /> 웨딩홀 비교 리스트
        </h1>
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

          {loading ? (
            <div className="text-center p-10 text-[var(--ink3)]">
              불러오는 중...
            </div>
          ) : fetchError ? (
            <div className="mx-4 mb-4 p-4 bg-[var(--red-light)] border border-[var(--red)] rounded-[var(--radius)] text-[var(--red)] text-sm leading-relaxed">
              <div className="font-medium mb-1">데이터를 불러오지 못했습니다</div>
              <div className="text-xs opacity-80">{fetchError}</div>
            </div>
          ) : sortedHalls.length === 0 ? (
            <div className="text-center p-10 text-[var(--ink3)]">
              등록된 웨딩홀이 없습니다.
            </div>
          ) : (
            <div className="cards">
              {sortedHalls.map((hall) => (
                <HallCard
                  key={hall.id}
                  hall={hall}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div className="section-divider my-2">
            <span>버스 대절 참고</span>
          </div>

          <div className="bus-section mx-4 mb-4 bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] p-4">
            <div className="text-[13px] font-medium mb-2.5">
              <TwEmoji emoji="🚌" size={14} /> 광주→서울 버스 대절 예상비용
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
                <div className="info-val text-[var(--ink)]">약 270~360만원</div>
              </div>
              <div className="info-cell">
                <div className="info-lbl">KTX 100명 왕복 비교</div>
                <div className="info-val text-[var(--red)]">약 780~920만원</div>
              </div>
            </div>
            <div className="note mt-2">
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
        반드시 직접 투어 후 견적 확인 권장 <TwEmoji emoji="💍" size={12} />
        <br />
        <br />
        업데이트: 2026년 4월
      </footer>

      {/* 새 등록 FAB */}
      <button className="fab" onClick={handleAdd} title="새 웨딩홀 등록">
        +
      </button>

      {/* 등록/수정 모달 */}
      {showModal && (
        <HallFormModal
          hall={editingHall}
          onClose={() => setShowModal(false)}
          onSaved={fetchHalls}
        />
      )}
    </>
  );
}
