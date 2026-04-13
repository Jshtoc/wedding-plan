"use client";

import { useState, useEffect } from "react";
import { Complex } from "@/data/complexes";
import TwEmoji from "./ui/TwEmoji";
import { useAlert, useConfirm } from "./ui/ConfirmModal";
import { useLoading } from "./ui/LoadingOverlay";

interface Props {
  complex?: Complex | null;
  onClose: () => void;
  onSaved: () => void;
}

const input =
  "w-full h-11 px-3.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums";
const textarea =
  "w-full px-3.5 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all resize-y leading-relaxed";
const label =
  "block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5";
const sectionTitle =
  "text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase";
const primaryBtn =
  "h-11 px-6 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]";
const ghostBtn =
  "h-11 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-50";

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" />
    </svg>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
  unit = "만원",
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={100}
        value={value || ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        placeholder={placeholder || "0"}
        className={input + " pr-12"}
      />
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 pointer-events-none">
        {unit}
      </span>
    </div>
  );
}

export default function ComplexFormModal({
  complex,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!complex;

  // 단지정보
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [dong, setDong] = useState("");
  const [yearUnits, setYearUnits] = useState("");
  const [area, setArea] = useState("");

  // 가격정보
  const [salePrice, setSalePrice] = useState(0);
  const [jeonsePrice, setJeonsePrice] = useState(0);
  const [peakPrice, setPeakPrice] = useState(0);
  const [lowPrice, setLowPrice] = useState(0);
  const [lastTradePrice, setLastTradePrice] = useState(0);

  // 입지분석
  const [commuteTime, setCommuteTime] = useState("");
  const [subwayLine, setSubwayLine] = useState("");
  const [workplace1, setWorkplace1] = useState("");
  const [workplace2, setWorkplace2] = useState("");
  const [schoolScore, setSchoolScore] = useState("");
  const [hazard, setHazard] = useState("");
  const [amenities, setAmenities] = useState("");
  const [isNewBuild, setIsNewBuild] = useState("");
  const [isCandidate, setIsCandidate] = useState(false);
  const [note, setNote] = useState("");

  // 좌표 (주소 검색 결과)
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [fullAddress, setFullAddress] = useState("");

  // 주소 검색
  const [addrQuery, setAddrQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showAlert = useAlert();
  const showConfirm = useConfirm();
  const loadingCtx = useLoading();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (complex) {
      setName(complex.name);
      setCity(complex.city);
      setDistrict(complex.district);
      setDong(complex.dong);
      setYearUnits(complex.yearUnits);
      setArea(complex.area);
      setSalePrice(complex.salePrice);
      setJeonsePrice(complex.jeonsePrice);
      setPeakPrice(complex.peakPrice);
      setLowPrice(complex.lowPrice);
      setLastTradePrice(complex.lastTradePrice);
      setCommuteTime(complex.commuteTime);
      setSubwayLine(complex.subwayLine);
      setWorkplace1(complex.workplace1);
      setWorkplace2(complex.workplace2);
      setSchoolScore(complex.schoolScore);
      setHazard(complex.hazard);
      setAmenities(complex.amenities);
      setIsNewBuild(complex.isNewBuild);
      setIsCandidate(complex.isCandidate);
      setNote(complex.note);
      if (complex.lat) setLat(complex.lat);
      if (complex.lng) setLng(complex.lng);
      if (complex.address) setFullAddress(complex.address);
    }
  }, [complex]);

  const handleDelete = async () => {
    if (!complex) return;
    const ok = await showConfirm(`"${complex.name}" 매물을 삭제하시겠습니까?`, { variant: "danger" });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/complexes/${complex.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        await showAlert(data.error || "삭제에 실패했습니다.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      await showAlert("네트워크 오류");
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = async () => {
    const q = addrQuery.trim();
    if (!q) {
      setSearchError("주소를 입력해주세요.");
      return;
    }
    setSearching(true);
    loadingCtx.show();
    setSearchError(null);
    try {
      const res = await fetch("/api/naver/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "주소 검색 실패");
        return;
      }
      // 좌표 + 주소 저장
      setLat(data.lat);
      setLng(data.lng);
      setFullAddress(data.roadAddress || q);
      // 시/구/동 자동 채움 (비어있을 때만)
      if (data.city && !city) setCity(data.city);
      if (data.district && !district) setDistrict(data.district);
      if (data.dong && !dong) setDong(data.dong);
      // 단지명도 비어있으면 검색어로 채움
      if (!name && q) setName(q);
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSearching(false);
      loadingCtx.hide();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      await showAlert("단지명을 입력하세요.");
      return;
    }
    setSaving(true);

    const data: Omit<Complex, "id"> = {
      name: name.trim(),
      city: city.trim(),
      district: district.trim(),
      dong: dong.trim(),
      yearUnits: yearUnits.trim(),
      area: area.trim(),
      salePrice: Math.max(0, Math.floor(salePrice) || 0),
      jeonsePrice: Math.max(0, Math.floor(jeonsePrice) || 0),
      peakPrice: Math.max(0, Math.floor(peakPrice) || 0),
      lowPrice: Math.max(0, Math.floor(lowPrice) || 0),
      lastTradePrice: Math.max(0, Math.floor(lastTradePrice) || 0),
      commuteTime: commuteTime.trim(),
      subwayLine: subwayLine.trim(),
      workplace1: workplace1.trim(),
      workplace2: workplace2.trim(),
      schoolScore: schoolScore.trim(),
      hazard: hazard.trim(),
      amenities: amenities.trim(),
      isNewBuild: isNewBuild.trim(),
      isCandidate,
      note: note.trim(),
      lat,
      lng,
      address: fullAddress || undefined,
    };

    const url = isEdit ? `/api/complexes/${complex!.id}` : "/api/complexes";
    const method = isEdit ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <div className={sectionTitle + " mb-1"}>
              {isEdit ? "Edit Complex" : "New Complex"}
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isEdit ? "단지 정보 수정" : "새 단지 등록"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-7 space-y-7">
          {/* ── 단지정보 ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TwEmoji emoji="🏢" size={14} />
              <span className={sectionTitle}>단지정보</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className={label}>단지명 *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 미리내동성"
                  className={input}
                />
              </div>
              {/* 주소 검색 */}
              <div>
                <label className={label}>주소 검색</label>
                <div className="flex gap-2">
                  <input
                    value={addrQuery}
                    onChange={(e) => {
                      setAddrQuery(e.target.value);
                      setSearchError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="단지명 또는 도로명주소 입력"
                    className={input + " flex-1"}
                    disabled={searching}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className={ghostBtn + " whitespace-nowrap"}
                  >
                    {searching ? "검색중..." : "검색"}
                  </button>
                </div>
                {searchError && (
                  <div className="mt-2 flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 px-3 py-2 rounded-lg">
                    <TwEmoji emoji="⚠️" size={13} className="flex-shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}
                {fullAddress && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-mint bg-mint/[0.06] border border-mint/20 px-3 py-2 rounded-lg">
                    <TwEmoji emoji="📍" size={13} className="flex-shrink-0" />
                    <span className="flex-1">{fullAddress}</span>
                    {lat && lng && (
                      <span className="text-[10px] text-white/30 tabular-nums flex-shrink-0">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 시 / 구 / 동 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>시</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="부천"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>구</label>
                  <input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="원미"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>동</label>
                  <input
                    value={dong}
                    onChange={(e) => setDong(e.target.value)}
                    placeholder="중"
                    className={input}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>연식 / 세대수</label>
                  <input
                    value={yearUnits}
                    onChange={(e) => setYearUnits(e.target.value)}
                    placeholder="1993 / 598"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>공급/전용면적</label>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="97 / 78"
                    className={input}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 가격정보 ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TwEmoji emoji="💰" size={14} />
              <span className={sectionTitle}>가격정보</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>매매가 (호가)</label>
                  <PriceInput value={salePrice} onChange={setSalePrice} />
                </div>
                <div>
                  <label className={label}>전세가</label>
                  <PriceInput value={jeonsePrice} onChange={setJeonsePrice} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>전고점</label>
                  <PriceInput value={peakPrice} onChange={setPeakPrice} />
                </div>
                <div>
                  <label className={label}>전저점</label>
                  <PriceInput value={lowPrice} onChange={setLowPrice} />
                </div>
                <div>
                  <label className={label}>직전 실거래가</label>
                  <PriceInput
                    value={lastTradePrice}
                    onChange={setLastTradePrice}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 입지분석 ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TwEmoji emoji="📍" size={14} />
              <span className={sectionTitle}>입지분석</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>강남역까지 소요시간</label>
                  <input
                    value={commuteTime}
                    onChange={(e) => setCommuteTime(e.target.value)}
                    placeholder="75분"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>전철 노선</label>
                  <input
                    value={subwayLine}
                    onChange={(e) => setSubwayLine(e.target.value)}
                    placeholder="7호선"
                    className={input}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>직장1 (본인)</label>
                  <input
                    value={workplace1}
                    onChange={(e) => setWorkplace1(e.target.value)}
                    placeholder="강남"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>직장2 (배우자)</label>
                  <input
                    value={workplace2}
                    onChange={(e) => setWorkplace2(e.target.value)}
                    placeholder="여의도"
                    className={input}
                  />
                </div>
              </div>
              <div>
                <label className={label}>학군 (근처 중학교 학업성취도)</label>
                <input
                  value={schoolScore}
                  onChange={(e) => setSchoolScore(e.target.value)}
                  placeholder="계남중 84%"
                  className={input}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>유해시설 여부</label>
                  <input
                    value={hazard}
                    onChange={(e) => setHazard(e.target.value)}
                    placeholder="X"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>5년 이내 신축 여부</label>
                  <input
                    value={isNewBuild}
                    onChange={(e) => setIsNewBuild(e.target.value)}
                    placeholder="O / X / -"
                    className={input}
                  />
                </div>
              </div>
              <div>
                <label className={label}>편의시설 (백화점, 마트, 병원 등)</label>
                <textarea
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  rows={2}
                  placeholder="백화점 2개, 대형마트 2개, 종합병원 1개"
                  className={textarea}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setIsCandidate((v) => !v)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <span
                    className={
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all " +
                      (isCandidate
                        ? "bg-mint/20 border-mint/50 shadow-[0_0_12px_-4px_rgba(0,255,225,0.5)]"
                        : "bg-white/[0.04] border-white/20")
                    }
                  >
                    <svg
                      className={
                        "w-3 h-3 text-mint transition-opacity " +
                        (isCandidate ? "opacity-100" : "opacity-0")
                      }
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 6l2.5 2.5 4.5-5" />
                    </svg>
                  </span>
                  <span className={
                    "text-sm transition-colors " +
                    (isCandidate ? "text-mint" : "text-white/70")
                  }>
                    <TwEmoji emoji="⭐" size={14} className="inline mr-1" />
                    임장 후보 단지로 선택
                  </span>
                </button>
              </div>
              <div>
                <label className={label}>메모</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="이 단지에 대한 메모를 남겨주세요..."
                  className={textarea}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02]">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="h-11 px-5 rounded-lg text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400/50 transition-colors"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} disabled={saving || deleting} className={ghostBtn}>
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting}
              className={primaryBtn}
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
