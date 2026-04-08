"use client";

import { useState, useEffect } from "react";
import { WeddingHall } from "@/data/halls";

interface Props {
  hall?: WeddingHall | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: Omit<WeddingHall, "id"> = {
  name: "",
  sub: "",
  price: 0,
  priceLabel: "180명 기준",
  priceText: "",
  priceLevel: "ok",
  ktx: 3,
  ktxText: "",
  ktxWarn: false,
  parking: 0,
  isBest: false,
  bestLabel: "",
  image: "",
  imageAlt: "",
  imageFallback: "🏛️",
  badges: [],
  infoGrid: [],
  extraInfoGrid: undefined,
  calc: { title: "📊 예상 견적", rows: [] },
  note: "",
  noteType: undefined,
};

export default function HallFormModal({ hall, onClose, onSaved }: Props) {
  const isEdit = !!hall;

  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [price, setPrice] = useState(0);
  const [priceLabel, setPriceLabel] = useState("180명 기준");
  const [priceText, setPriceText] = useState("");
  const [priceLevel, setPriceLevel] = useState<"ok" | "warn" | "over">("ok");
  const [ktx, setKtx] = useState(3);
  const [ktxText, setKtxText] = useState("");
  const [ktxWarn, setKtxWarn] = useState(false);
  const [parking, setParking] = useState(0);
  const [isBest, setIsBest] = useState(false);
  const [bestLabel, setBestLabel] = useState("");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageFallback, setImageFallback] = useState("🏛️");
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<"" | "warn" | "danger">("");

  // badges as comma-separated text for simplicity
  const [badgesText, setBadgesText] = useState("");
  const [badgesColors, setBadgesColors] = useState("");

  // info grid rows
  const [infoRows, setInfoRows] = useState<{ label: string; value: string }[]>([
    { label: "", value: "" },
  ]);
  const [extraRows, setExtraRows] = useState<{ label: string; value: string }[]>([]);

  // calc
  const [calcTitle, setCalcTitle] = useState("📊 예상 견적");
  const [calcRows, setCalcRows] = useState<
    { label: string; value: string; isTotal?: boolean }[]
  >([{ label: "", value: "" }]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hall) {
      setName(hall.name);
      setSub(hall.sub);
      setPrice(hall.price);
      setPriceLabel(hall.priceLabel);
      setPriceText(hall.priceText);
      setPriceLevel(hall.priceLevel);
      setKtx(hall.ktx);
      setKtxText(hall.ktxText);
      setKtxWarn(hall.ktxWarn || false);
      setParking(hall.parking);
      setIsBest(hall.isBest || false);
      setBestLabel(hall.bestLabel || "");
      setImage(hall.image);
      setImageAlt(hall.imageAlt);
      setImageFallback(hall.imageFallback);
      setNote(hall.note);
      setNoteType((hall.noteType as "" | "warn" | "danger") || "");
      setBadgesText(hall.badges.map((b) => b.text).join(", "));
      setBadgesColors(hall.badges.map((b) => b.color).join(", "));
      setInfoRows(hall.infoGrid.length > 0 ? hall.infoGrid : [{ label: "", value: "" }]);
      setExtraRows(hall.extraInfoGrid || []);
      setCalcTitle(hall.calc.title);
      setCalcRows(
        hall.calc.rows.length > 0 ? hall.calc.rows : [{ label: "", value: "" }]
      );
    }
  }, [hall]);

  const handleSave = async () => {
    if (!name.trim()) return alert("웨딩홀 이름을 입력하세요.");
    setSaving(true);

    const badgeTexts = badgesText.split(",").map((s) => s.trim()).filter(Boolean);
    const badgeColorArr = badgesColors.split(",").map((s) => s.trim());
    const badges = badgeTexts.map((text, i) => ({
      text,
      color: (badgeColorArr[i] || "gray") as "gold" | "green" | "red" | "amber" | "gray",
    }));

    const data: Omit<WeddingHall, "id"> = {
      name,
      sub,
      price,
      priceLabel,
      priceText,
      priceLevel,
      ktx,
      ktxText,
      ktxWarn: ktxWarn || undefined,
      parking,
      isBest: isBest || undefined,
      bestLabel: bestLabel || undefined,
      image,
      imageAlt,
      imageFallback,
      badges,
      infoGrid: infoRows.filter((r) => r.label.trim()),
      extraInfoGrid:
        extraRows.filter((r) => r.label.trim()).length > 0
          ? extraRows.filter((r) => r.label.trim())
          : undefined,
      calc: {
        title: calcTitle,
        rows: calcRows.filter((r) => r.label.trim()),
      },
      note,
      noteType: noteType || undefined,
    };

    const url = isEdit ? `/api/halls/${hall!.id}` : "/api/halls";
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

  const addInfoRow = () => setInfoRows([...infoRows, { label: "", value: "" }]);
  const addExtraRow = () => setExtraRows([...extraRows, { label: "", value: "" }]);
  const addCalcRow = () => setCalcRows([...calcRows, { label: "", value: "" }]);

  const updateInfoRow = (i: number, field: "label" | "value", val: string) => {
    const rows = [...infoRows];
    rows[i] = { ...rows[i], [field]: val };
    setInfoRows(rows);
  };
  const updateExtraRow = (i: number, field: "label" | "value", val: string) => {
    const rows = [...extraRows];
    rows[i] = { ...rows[i], [field]: val };
    setExtraRows(rows);
  };
  const updateCalcRow = (
    i: number,
    field: "label" | "value" | "isTotal",
    val: string | boolean
  ) => {
    const rows = [...calcRows];
    rows[i] = { ...rows[i], [field]: val };
    setCalcRows(rows);
  };

  const removeInfoRow = (i: number) => setInfoRows(infoRows.filter((_, j) => j !== i));
  const removeExtraRow = (i: number) => setExtraRows(extraRows.filter((_, j) => j !== i));
  const removeCalcRow = (i: number) => setCalcRows(calcRows.filter((_, j) => j !== i));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "웨딩홀 수정" : "새 웨딩홀 등록"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* 기본 정보 */}
          <div className="form-section">
            <div className="form-section-title">기본 정보</div>
            <div className="form-grid">
              <div className="form-group full">
                <label>웨딩홀 이름 *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 제이오스티엘" />
              </div>
              <div className="form-group full">
                <label>위치 설명</label>
                <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="예: 서울 구로구 · 1호선 구로역 도보 2분" />
              </div>
              <div className="form-group">
                <label>예상 가격 (만원, 숫자)</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>가격 표시 텍스트</label>
                <input value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="예: 약 1,367만원" />
              </div>
              <div className="form-group">
                <label>가격 기준</label>
                <input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="예: 180명 기준" />
              </div>
              <div className="form-group">
                <label>가격 등급</label>
                <select value={priceLevel} onChange={(e) => setPriceLevel(e.target.value as "ok" | "warn" | "over")}>
                  <option value="ok">적정 (초록)</option>
                  <option value="warn">주의 (노랑)</option>
                  <option value="over">초과 (빨강)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 교통 & 주차 */}
          <div className="form-section">
            <div className="form-section-title">교통 & 주차</div>
            <div className="form-grid">
              <div className="form-group">
                <label>KTX 접근성 (1~5)</label>
                <input type="number" min={1} max={5} value={ktx} onChange={(e) => setKtx(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>주차 대수</label>
                <input type="number" value={parking} onChange={(e) => setParking(Number(e.target.value))} />
              </div>
              <div className="form-group full">
                <label>KTX 경로 설명</label>
                <input value={ktxText} onChange={(e) => setKtxText(e.target.value)} placeholder="예: 서울역 → 1호선 직행 · 약 20분" />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={ktxWarn} onChange={(e) => setKtxWarn(e.target.checked)} />
                  KTX 접근 불편 (경고 표시)
                </label>
              </div>
            </div>
          </div>

          {/* 이미지 */}
          <div className="form-section">
            <div className="form-section-title">이미지</div>
            <div className="form-grid">
              <div className="form-group full">
                <label>이미지 URL</label>
                <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>이미지 alt 텍스트</label>
                <input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
              </div>
              <div className="form-group">
                <label>대체 이모지</label>
                <input value={imageFallback} onChange={(e) => setImageFallback(e.target.value)} placeholder="🏛️" />
              </div>
            </div>
          </div>

          {/* 추천 */}
          <div className="form-section">
            <div className="form-section-title">추천 설정</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={isBest} onChange={(e) => setIsBest(e.target.checked)} />
                  추천 웨딩홀로 표시
                </label>
              </div>
              <div className="form-group">
                <label>추천 라벨</label>
                <input value={bestLabel} onChange={(e) => setBestLabel(e.target.value)} placeholder="예: ★ 가격 최우선 추천" />
              </div>
            </div>
          </div>

          {/* 뱃지 */}
          <div className="form-section">
            <div className="form-section-title">뱃지</div>
            <div className="form-grid">
              <div className="form-group full">
                <label>뱃지 텍스트 (쉼표 구분)</label>
                <input value={badgesText} onChange={(e) => setBadgesText(e.target.value)} placeholder="가격 1위, KTX 접근성 ★★★★★, 단독홀" />
              </div>
              <div className="form-group full">
                <label>뱃지 색상 (쉼표 구분: gold/green/red/amber/gray)</label>
                <input value={badgesColors} onChange={(e) => setBadgesColors(e.target.value)} placeholder="gold, green, green" />
              </div>
            </div>
          </div>

          {/* 정보 그리드 */}
          <div className="form-section">
            <div className="form-section-title">
              상세 정보
              <button className="btn-add" onClick={addInfoRow}>+ 행 추가</button>
            </div>
            {infoRows.map((row, i) => (
              <div key={i} className="form-grid mb-1">
                <div className="form-group">
                  <input value={row.label} onChange={(e) => updateInfoRow(i, "label", e.target.value)} placeholder="항목명" />
                </div>
                <div className="form-group flex gap-1">
                  <input value={row.value} onChange={(e) => updateInfoRow(i, "value", e.target.value)} placeholder="값" className="flex-1" />
                  <button className="btn-remove" onClick={() => removeInfoRow(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 정보 그리드 */}
          <div className="form-section">
            <div className="form-section-title">
              추가 정보 (선택)
              <button className="btn-add" onClick={addExtraRow}>+ 행 추가</button>
            </div>
            {extraRows.map((row, i) => (
              <div key={i} className="form-grid mb-1">
                <div className="form-group">
                  <input value={row.label} onChange={(e) => updateExtraRow(i, "label", e.target.value)} placeholder="항목명" />
                </div>
                <div className="form-group flex gap-1">
                  <input value={row.value} onChange={(e) => updateExtraRow(i, "value", e.target.value)} placeholder="값" className="flex-1" />
                  <button className="btn-remove" onClick={() => removeExtraRow(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* 견적 계산 */}
          <div className="form-section">
            <div className="form-section-title">
              예상 견적
              <button className="btn-add" onClick={addCalcRow}>+ 행 추가</button>
            </div>
            <div className="form-group mb-2">
              <label>견적 타이틀</label>
              <input value={calcTitle} onChange={(e) => setCalcTitle(e.target.value)} />
            </div>
            {calcRows.map((row, i) => (
              <div key={i} className="form-grid mb-1">
                <div className="form-group">
                  <input value={row.label} onChange={(e) => updateCalcRow(i, "label", e.target.value)} placeholder="항목" />
                </div>
                <div className="form-group flex gap-1 items-center">
                  <input value={row.value} onChange={(e) => updateCalcRow(i, "value", e.target.value)} placeholder="금액" className="flex-1" />
                  <label className="checkbox-label !text-[10px] whitespace-nowrap">
                    <input type="checkbox" checked={row.isTotal || false} onChange={(e) => updateCalcRow(i, "isTotal", e.target.checked)} />
                    합계
                  </label>
                  <button className="btn-remove" onClick={() => removeCalcRow(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* 메모 */}
          <div className="form-section">
            <div className="form-section-title">메모</div>
            <div className="form-grid">
              <div className="form-group full">
                <label>메모 / 특이사항</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="이 웨딩홀에 대한 메모를 남겨주세요..." />
              </div>
              <div className="form-group">
                <label>메모 스타일</label>
                <select value={noteType} onChange={(e) => setNoteType(e.target.value as "" | "warn" | "danger")}>
                  <option value="">기본</option>
                  <option value="warn">주의 (노랑)</option>
                  <option value="danger">경고 (빨강)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
