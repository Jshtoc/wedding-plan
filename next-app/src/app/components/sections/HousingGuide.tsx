"use client";

import { useState } from "react";
import TwEmoji from "../ui/TwEmoji";

export default function HousingGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "w-full flex items-center justify-between gap-3 p-4 rounded-2xl transition-colors border " +
          (open
            ? "bg-mint/10 border-mint/30 text-mint"
            : "bg-white/[0.04] border-white/10 text-white/80 hover:border-white/20 hover:bg-white/[0.06]")
        }
      >
        <div className="flex items-center gap-3">
          <TwEmoji emoji="🏡" size={20} />
          <span className="text-sm font-semibold">집구하기 꿀팁!</span>
          <span className="text-[10px] text-white/40 font-normal">
            체크리스트 20 + 계약 전 필수 확인
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={
            "flex-shrink-0 transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
        >
          <path d="M4 6 L8 10 L12 6" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 text-sm text-white/80 leading-relaxed">
          {/* Intro */}
          <div className="bg-mint/[0.06] border border-mint/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TwEmoji emoji="❤️" size={18} className="flex-shrink-0 mt-0.5" />
              <div className="text-[13px] text-white/70 leading-relaxed">
                집 구할 때 어떤 기준으로 봐야 할지 헷갈리셨죠? 실제로 집 보면서
                체크했던 기준 20가지를 정리했어요. 이 체크리스트로 실패 없는
                신혼집 구하시길 바랄게요!
              </div>
            </div>
          </div>

          {/* 1. 준비물 */}
          <Section
            num="1"
            title="집 보러 갈 때 준비물"
            icon="🎒"
          >
            <ul className="space-y-1.5">
              <Li>체크리스트</Li>
              <Li>카메라/휴대폰 (사진 기록용)</Li>
              <Li>줄자 (실측용)</Li>
              <Li>필수 질문 목록 (관리비, 난방, 주차, 재개발 가능성 등)</Li>
            </ul>
            <Tip>줄자를 꼭 챙기면, 가구 배치와 발코니 폭을 바로 확인 가능</Tip>
          </Section>

          {/* 2. 체크리스트 20 */}
          <Section
            num="2"
            title="집 볼 때 체크리스트 20"
            icon="📋"
          >
            <div className="text-[11px] text-white/50 mb-3">
              실제로 집 보면서 쓰던 기준 그대로 정리했어요
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              <Check>입지: 역세권, 학군, 상권, 생활 편의성</Check>
              <Check>단지 규모: 세대 수, 동 수, 층수</Check>
              <Check>주차: 세대당 주차대수, 주차난 여부</Check>
              <Check>향/채광: 남향/북향, 아침·저녁 채광 확인</Check>
              <Check>소음: 도로, 상가, 이웃 소음 체크</Check>
              <Check>조경/공원: 산책로, 놀이터, 운동시설</Check>
              <Check>엘리베이터: 대수, 혼잡도, 유지관리</Check>
              <Check>층간소음: 위/아래층 소음 여부</Check>
              <Check>난방 방식: 개별/중앙난방, 관리비 영향</Check>
              <Check>수압/배관: 샤워 수압, 누수, 배수 상태</Check>
              <Check>관리비: 평형 대비 금액, 계절별 변동</Check>
              <Check>세대 구조: 방/화장실 개수, 수납 공간</Check>
              <Check>주방 구조: 조리 공간, 가스/전기 위치</Check>
              <Check>발코니/확장: 세탁기/건조기 위치</Check>
              <Check>보안: CCTV, 경비, 출입 통제</Check>
              <Check>단지 편의시설: 헬스장, 키즈카페 등</Check>
              <Check>재건축/재개발: 향후 가치, 제한 여부</Check>
              <Check>교통: 버스·지하철, 출퇴근 편리성</Check>
              <Check>생활 편의시설: 마트, 병원, 은행</Check>
              <Check>주변 환경: 쓰레기 수거, 하천, 공기질</Check>
            </div>
          </Section>

          {/* 3. 추가 유용 항목 */}
          <Section
            num="3"
            title="추가 유용 항목"
            icon="💡"
          >
            <ul className="space-y-1.5">
              <Li>내 최우선 조건: 꼭 필요한 항목 3~5개 표시</Li>
              <Li>낮/밤 두 번 방문해서 분위기 확인</Li>
              <Li>집 주변 직접 걸어보기 (상권/소음 체감)</Li>
              <Li>
                계약 전 필수 확인: 관리비 내역, 등기부 등본, 근저당, 재건축
                가능성
              </Li>
              <Li>사진/영상 기록: 방별 사진 + 동영상</Li>
            </ul>
          </Section>

          {/* 4. 합격 기준 */}
          <Section
            num="4"
            title="체크 기반 합격 기준"
            icon="🏆"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                <div className="text-lg font-semibold text-emerald-300">
                  16~20
                </div>
                <div className="text-[10px] text-emerald-300/70 mt-1">
                  합격
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20">
                <div className="text-lg font-semibold text-amber-300">
                  12~15
                </div>
                <div className="text-[10px] text-amber-300/70 mt-1">
                  재검토
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20">
                <div className="text-lg font-semibold text-red-300">0~11</div>
                <div className="text-[10px] text-red-300/70 mt-1">탈락</div>
              </div>
            </div>
          </Section>

          {/* 5. 계약 전 필수 확인 */}
          <Section
            num="5"
            title="계약 전 필수 확인"
            icon="🛑"
          >
            <ul className="space-y-1.5 mb-4">
              <Li>관리비 상세 내역</Li>
              <Li>등기부등본: 근저당 + 소유자 확인 (실소유주 일치 여부)</Li>
              <Li>최근 공사 이력 (배관/외벽 등)</Li>
              <Li>재건축/재개발 진행 여부</Li>
            </ul>

            <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-400/20">
              <div className="text-[10px] font-semibold text-red-300/80 tracking-[0.15em] uppercase mb-2">
                Must Check
              </div>
              <ol className="space-y-1.5 text-[12px] text-white/70 list-decimal list-inside">
                <li>입지 — 역세권, 학군, 생활 편의성 핵심 위치 조건</li>
                <li>주차 — 세대당 주차 가능 여부, 주차난</li>
                <li>향/채광 — 남향 또는 채광 충분 여부</li>
                <li>층간소음 — 위/아래층 소음 심한 집은 패스</li>
                <li>난방 방식 / 수압 — 불량 집은 생활 불편</li>
                <li>보안 — CCTV, 경비, 출입 통제 미비 집은 위험</li>
                <li>재건축/재개발 — 법적 문제 또는 가치 제한</li>
              </ol>
              <div className="mt-3 text-[11px] text-red-300/70">
                위 항목 중 하나라도 문제 있으면 재검토 추천
              </div>
            </div>
          </Section>

          {/* 한줄 정리 */}
          <div className="text-center py-4 border-t border-white/10">
            <div className="text-[13px] text-white/60">
              체크 많이 하는 것보다{" "}
              <span className="text-mint font-semibold">
                &ldquo;필수 조건 충족&rdquo;
              </span>
              이 더 중요해요
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────── */

function Section({
  num,
  title,
  icon,
  children,
}: {
  num: string;
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <TwEmoji emoji={icon} size={16} />
        <h3 className="text-sm font-semibold text-white">
          <span className="text-mint/80 mr-1">{num}.</span>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12px] text-white/70">
      <span className="text-mint/60 mt-0.5 flex-shrink-0">•</span>
      <span>{children}</span>
    </li>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-white/70">
      <span className="flex-shrink-0 w-3.5 h-3.5 mt-0.5 rounded border border-white/20 bg-white/[0.04]" />
      <span>{children}</span>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 text-[11px] text-mint/70 bg-mint/[0.04] border border-mint/10 rounded-lg px-3 py-2">
      <TwEmoji emoji="💡" size={12} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
