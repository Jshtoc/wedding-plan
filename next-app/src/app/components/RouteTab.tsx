import { routeItems } from "@/data/halls";
import CopyButton from "./CopyButton";
import TwEmoji from "./ui/TwEmoji";

export default function RouteTab() {
  return (
    <div className="route-wrap">
      <div className="route-header">
        <h2>목동 출발 웨딩홀 투어 동선</h2>
        <p>
          6곳을 하루에 효율적으로 돌 수 있는 최적 경로입니다.
          <br />
          가까운 곳부터 루프를 그리며 이동합니다.
        </p>
        <div className="route-total">
          <div className="route-total-item">
            <div className="sum-label">총 방문</div>
            <div className="sum-val">6곳</div>
          </div>
          <div className="route-total-item">
            <div className="sum-label">예상 이동시간</div>
            <div className="sum-val">약 2시간</div>
          </div>
          <div className="route-total-item">
            <div className="sum-label">총 거리</div>
            <div className="sum-val">약 65km</div>
          </div>
        </div>
      </div>

      <div className="timeline">
        {routeItems.map((item, i) => {
          if (item.kind === "drive") {
            return (
              <div key={i} className="tl-connector">
                <div className="tl-drive">{item.data.text}</div>
                <div className="tl-drive-line"></div>
              </div>
            );
          }

          const stop = item.data;
          const dotClass = [
            "tl-dot",
            stop.type === "start" ? "start" : "",
            stop.type === "end" ? "end" : "",
            stop.isBest ? "bg-[var(--gold)]" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const dotLabel =
            stop.type === "start"
              ? "출"
              : stop.type === "end"
                ? "끝"
                : String(stop.number);

          const cardClass = [
            "tl-card",
            stop.type === "start" ? "border-l-[3px] border-l-[var(--green)]" : "",
            stop.type === "end" ? "border-l-[3px] border-l-[var(--ink3)]" : "",
            stop.isBest ? "border-2 border-[var(--gold)]" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={i} className="tl-stop">
              <div className="tl-marker">
                <div className={dotClass}>{dotLabel}</div>
                {stop.type !== "end" && <div className="tl-line"></div>}
              </div>
              <div className={cardClass}>
                {stop.isBest && stop.bestLabel && (
                  <div className="inline-block bg-[var(--gold-light)] text-[var(--gold)] text-[10px] font-medium px-2.5 py-[3px] rounded-[20px] mb-2">
                    {stop.bestLabel}
                  </div>
                )}

                {stop.price ? (
                  <div className="tl-card-head">
                    <div className="tl-name">{stop.name}</div>
                    <div className={`tl-price price-${stop.priceLevel}`}>
                      {stop.price}
                    </div>
                  </div>
                ) : (
                  <div className="tl-name">{stop.name}</div>
                )}

                <div className="tl-addr">{stop.address}</div>

                {stop.tags && (
                  <div className="tl-meta">
                    {stop.tags.map((tag, j) => (
                      <span key={j} className="tl-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {stop.type === "stop" && (
                  <CopyButton address={stop.address} />
                )}

                {stop.tip && <div className="tl-tip">{stop.tip}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-3.5 bg-[var(--gold-light)] rounded-[var(--radius)] text-xs text-[var(--ink2)] leading-[1.7]">
        <strong className="text-[var(--gold)]">
          <TwEmoji emoji="💡" size={14} /> 투어 팁
        </strong>
        <br />
        · 오전 10시 출발 → 3곳 방문 → 구로/신도림 근처 점심 → 3곳 방문 →
        오후 4~5시 종료
        <br />
        · 각 웨딩홀 투어는 30~40분 소요 (상담 포함 시 1시간)
        <br />
        · 토요일 오전에는 실제 예식 진행을 볼 수 있어 분위기 확인 가능
        <br />· 주소 복사 버튼으로 네이버/카카오 네비에 바로 붙여넣기 가능
      </div>
    </div>
  );
}
