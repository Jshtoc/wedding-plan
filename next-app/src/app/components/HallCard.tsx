"use client";

import { useState } from "react";
import { WeddingHall } from "@/data/halls";
import TwEmoji from "./ui/TwEmoji";

interface Props {
  hall: WeddingHall;
  onEdit: (hall: WeddingHall) => void;
  onDelete: (id: number) => void;
}

export default function HallCard({ hall, onEdit, onDelete }: Props) {
  const [imgError, setImgError] = useState(false);

  const handleDelete = () => {
    if (confirm(`"${hall.name}" 을(를) 삭제하시겠습니까?`)) {
      onDelete(hall.id);
    }
  };

  return (
    <div
      className={`card${hall.isBest ? " best" : ""}`}
      data-price={hall.price}
      data-ktx={hall.ktx}
      data-parking={hall.parking}
    >
      {hall.isBest && hall.bestLabel && (
        <div className="best-banner">{hall.bestLabel}</div>
      )}

      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="card-img"
          src={hall.image}
          alt={hall.imageAlt}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="img-placeholder">{hall.imageFallback}</div>
      )}

      <div className="card-body">
        <div className="card-head">
          <div>
            <div className="card-title">{hall.name}</div>
            <div className="card-sub">{hall.sub}</div>
          </div>
          <div className="price-box">
            <div className="price-label">{hall.priceLabel}</div>
            <div className={`price-val price-${hall.priceLevel}`}>
              {hall.priceText}
            </div>
          </div>
        </div>

        <div className={`ktx-row${hall.ktxWarn ? " warn" : ""}`}>
          <TwEmoji emoji={hall.ktxWarn ? "🚇" : "🚄"} size={16} />{" "}
          <span>{hall.ktxText}</span>
        </div>

        <div className="badges">
          {hall.badges.map((b, i) => (
            <span key={i} className={`badge b-${b.color}`}>
              {b.text}
            </span>
          ))}
        </div>

        <div
          className={`info-grid${hall.infoGrid.length === 3 ? " three" : ""}`}
        >
          {hall.infoGrid.map((info, i) => (
            <div key={i} className="info-cell">
              <div className="info-lbl">{info.label}</div>
              <div className="info-val">{info.value}</div>
            </div>
          ))}
        </div>

        {hall.extraInfoGrid && (
          <div
            className={`info-grid${hall.extraInfoGrid.length === 3 ? " three" : ""}`}
          >
            {hall.extraInfoGrid.map((info, i) => (
              <div key={i} className="info-cell">
                <div className="info-lbl">{info.label}</div>
                <div className="info-val">{info.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="calc-wrap">
          <div className="calc-title">{hall.calc.title}</div>
          {hall.calc.rows.map((row, i) => (
            <div key={i} className={`calc-row${row.isTotal ? " total" : ""}`}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>

        <div
          className={`note mt-2.5${hall.noteType ? ` ${hall.noteType}` : ""}`}
        >
          {hall.note}
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => onEdit(hall)}>
          <TwEmoji emoji="✏️" size={14} /> 수정
        </button>
        <button className="btn-delete" onClick={handleDelete}>
          <TwEmoji emoji="🗑️" size={14} /> 삭제
        </button>
      </div>
    </div>
  );
}
