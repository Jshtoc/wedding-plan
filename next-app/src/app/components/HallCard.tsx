"use client";

import { useState } from "react";
import { WeddingHall } from "@/data/halls";

export default function HallCard({ hall }: { hall: WeddingHall }) {
  const [imgError, setImgError] = useState(false);

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
          {hall.ktxWarn ? "🚇" : "🚄"} <span>{hall.ktxText}</span>
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
          className={`note${hall.noteType ? ` ${hall.noteType}` : ""}`}
          style={{ marginTop: 10 }}
        >
          {hall.note}
        </div>
      </div>
    </div>
  );
}
