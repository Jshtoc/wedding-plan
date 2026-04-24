"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  PersonAsset,
  AssetRole,
  ROLE_META,
  emptyAsset,
  totalAssets,
  combinedAnnualIncome,
  combinedTotalAssets,
} from "@/data/assets";
import TwEmoji from "../ui/TwEmoji";
import { AddressSearchInput, type AddressResult } from "../ui/AddressSearch";

interface Props {
  initial: PersonAsset[];
}

const input =
  "w-full h-10 px-3 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all tabular-nums";
const textarea =
  "w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-mint/60 focus:ring-2 focus:ring-mint/20 transition-all resize-y leading-relaxed";
const label =
  "block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1";
const sectionLabel =
  "text-[10px] font-semibold text-mint/70 tracking-[0.2em] uppercase";

/** 만원 → "5억 9,500만" / "3,800만" */
function formatWon(value: number): string {
  if (!value) return "0";
  const eok = Math.floor(value / 10000);
  const man = value % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString()}만`;
}

export default function AssetsSection({ initial }: Props) {
  const [groom, setGroom] = useState<PersonAsset>(
    () => initial.find((a) => a.role === "groom") || emptyAsset("groom")
  );
  const [bride, setBride] = useState<PersonAsset>(
    () => initial.find((a) => a.role === "bride") || emptyAsset("bride")
  );
  const [saving, setSaving] = useState<AssetRole | null>(null);
  const [saved, setSaved] = useState<AssetRole | null>(null);

  useEffect(() => {
    const g = initial.find((a) => a.role === "groom");
    const b = initial.find((a) => a.role === "bride");
    if (g) setGroom(g);
    if (b) setBride(b);
  }, [initial]);

  const handleSave = useCallback(
    async (role: AssetRole) => {
      const data = role === "groom" ? groom : bride;
      setSaving(role);
      try {
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: undefined }),
        });
        setSaved(role);
        setTimeout(() => setSaved(null), 1500);
      } catch {
        // silent
      }
      setSaving(null);
    },
    [groom, bride]
  );

  const combined = combinedAnnualIncome(groom, bride);
  const combinedAssets = combinedTotalAssets(groom, bride);

  return (
    <div className="space-y-8">
      {/* ── 부부합산 요약 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="신랑 총 자산"
          value={formatWon(totalAssets(groom))}
          icon="🤵"
        />
        <SummaryCard
          label="신부 총 자산"
          value={formatWon(totalAssets(bride))}
          icon="👰"
        />
        <SummaryCard
          label="부부합산 자산"
          value={formatWon(combinedAssets)}
          icon="💎"
        />
        <SummaryCard
          label="부부합산 연소득"
          value={formatWon(combined)}
          icon="💰"
        />
      </div>

      {/* ── 신랑 / 신부 카드 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PersonCard
          asset={groom}
          onChange={setGroom}
          onSave={() => handleSave("groom")}
          saving={saving === "groom"}
          saved={saved === "groom"}
        />
        <PersonCard
          asset={bride}
          onChange={setBride}
          onSave={() => handleSave("bride")}
          saving={saving === "bride"}
          saved={saved === "bride"}
        />
      </div>

      {/* ── 대출 자격 요약 ── */}
      <LoanEligibility groom={groom} bride={bride} />
    </div>
  );
}

/* ── Summary card ────────────────────────────────────────────── */

function SummaryCard({
  label: labelText,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <TwEmoji emoji={icon} size={14} />
        <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
          {labelText}
        </span>
      </div>
      <div className="text-base font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

/* ── Person card (editable) ──────────────────────────────────── */

interface PersonCardProps {
  asset: PersonAsset;
  onChange: (a: PersonAsset) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function PersonCard({ asset, onChange, onSave, saving, saved }: PersonCardProps) {
  const meta = ROLE_META[asset.role];

  // Track dirty state — snapshot the initial value on mount / after save
  const baselineRef = useRef(JSON.stringify(asset));
  useEffect(() => {
    if (saved) baselineRef.current = JSON.stringify(asset);
  }, [saved, asset]);
  const isDirty = JSON.stringify(asset) !== baselineRef.current;

  const set = (patch: Partial<PersonAsset>) =>
    onChange({ ...asset, ...patch });

  const numChange = (field: keyof PersonAsset) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set({ [field]: parseInt(e.target.value, 10) || 0 } as Partial<PersonAsset>);

  const boolChange = (field: keyof PersonAsset) => () =>
    set({ [field]: !asset[field] } as Partial<PersonAsset>);

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="w-9 h-9 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
          <TwEmoji emoji={meta.icon} size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{meta.label}</div>
          <div className="text-[10px] text-white/40">자산 & 대출 정보</div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* 자산 현황 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TwEmoji emoji="💰" size={12} />
            <span className={sectionLabel}>자산 현황</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="현금 / 예금" value={asset.cash} onChange={numChange("cash")} unit="만원" />
            <NumberField label="주식 / 투자" value={asset.stocks} onChange={numChange("stocks")} unit="만원" />
            <NumberField label="청약 / 적금" value={asset.savings} onChange={numChange("savings")} unit="만원" />
            <NumberField label="기타 자산" value={asset.otherAssets} onChange={numChange("otherAssets")} unit="만원" />
          </div>
          {asset.otherAssets > 0 && (
            <div className="mt-3">
              <label className={label}>기타 자산 설명</label>
              <input
                value={asset.otherNote}
                onChange={(e) => set({ otherNote: e.target.value })}
                placeholder="예: 자동차, 보험 해지환급금 등"
                className={input}
              />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-mint/5 border border-mint/15">
            <span className="text-[11px] text-white/50">자산 합계</span>
            <span className="text-sm font-semibold text-mint tabular-nums">
              {formatWon(totalAssets(asset))}
            </span>
          </div>
        </div>

        {/* 소득 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TwEmoji emoji="💵" size={12} />
            <span className={sectionLabel}>소득</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="월 소득" value={asset.monthlyIncome} onChange={numChange("monthlyIncome")} unit="만원" />
            <NumberField label="연 소득" value={asset.annualIncome} onChange={numChange("annualIncome")} unit="만원" />
          </div>
        </div>

        {/* 대출 심사 정보 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TwEmoji emoji="🏦" size={12} />
            <span className={sectionLabel}>대출 심사 정보</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="나이" value={asset.age} onChange={numChange("age")} unit="세" />
            <NumberField label="신용점수" value={asset.creditScore} onChange={numChange("creditScore")} unit="점" />
            <NumberField label="무주택 기간" value={asset.homelessYears} onChange={numChange("homelessYears")} unit="년" />
            <NumberField label="기존 대출 총액" value={asset.existingLoans} onChange={numChange("existingLoans")} unit="만원" />
            <NumberField label="순자산" value={asset.netAssets} onChange={numChange("netAssets")} unit="만원" />
          </div>
          <div className="mt-3 space-y-2">
            <ToggleRow
              label="무주택 세대주"
              checked={asset.isHomeless}
              onToggle={boolChange("isHomeless")}
            />
            <ToggleRow
              label="생애최초 주택구입"
              checked={asset.isFirstHome}
              onToggle={boolChange("isFirstHome")}
            />
          </div>
        </div>

        {/* 직장 주소 — 여러 개 등록 가능, 매물별 출퇴근 시간 자동 계산에 사용 */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <TwEmoji emoji="🏢" size={12} />
              <span className={sectionLabel}>직장 / 자주 가는 곳</span>
              <span className="text-[10px] text-white/35">
                매물별 출퇴근 시간 자동 계산에 사용
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                set({
                  workplaces: [
                    ...asset.workplaces,
                    { label: "", address: "", lat: 0, lng: 0 },
                  ],
                })
              }
              className="text-[10px] text-mint/70 hover:text-mint transition-colors"
            >
              + 추가
            </button>
          </div>
          {asset.workplaces.length === 0 ? (
            <div className="rounded-lg bg-white/[0.02] border border-white/5 border-dashed px-3.5 py-4 text-center">
              <div className="text-[11px] text-white/40">
                등록된 직장이 없습니다. 우측 "+ 추가" 버튼으로 등록하세요.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {asset.workplaces.map((wp, idx) => {
                return (
                  <div
                    key={idx}
                    className="rounded-lg bg-white/[0.02] border border-white/10 p-2.5 space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        value={wp.label}
                        onChange={(e) => {
                          const next = [...asset.workplaces];
                          next[idx] = { ...next[idx], label: e.target.value };
                          set({ workplaces: next });
                        }}
                        placeholder="이름 (예: 본사, 여의도 지점)"
                        className={input + " flex-1 !h-9"}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set({
                            workplaces: asset.workplaces.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        aria-label="직장 삭제"
                        className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md text-white/30 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                        </svg>
                      </button>
                    </div>
                    <AddressSearchInput
                      value={
                        wp.address
                          ? { roadAddress: wp.address, jibunAddress: "", lat: wp.lat, lng: wp.lng }
                          : null
                      }
                      onChange={(r: AddressResult | null) => {
                        const next = [...asset.workplaces];
                        next[idx] = {
                          ...next[idx],
                          address: r ? (r.roadAddress || r.jibunAddress || "") : "",
                          lat: r?.lat ?? 0,
                          lng: r?.lng ?? 0,
                        };
                        set({ workplaces: next });
                      }}
                      placeholder="직장 주소 검색"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <label className={label}>메모</label>
          <textarea
            value={asset.note}
            onChange={(e) => set({ note: e.target.value })}
            rows={5}
            placeholder="월 지출 내역, 고정비, 저축 계획 등..."
            className={textarea}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || (!isDirty && !saved)}
          className={
            "w-full h-10 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] " +
            (saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
              : isDirty
                ? "bg-mint text-gray-900 hover:bg-mint/90 shadow-[0_4px_16px_-4px_rgba(0,255,225,0.4)] disabled:opacity-50"
                : "bg-white/[0.04] text-white/20 border border-white/10 cursor-not-allowed")
          }
        >
          {saving ? "저장 중..." : saved ? "저장 완료" : isDirty ? "변경사항 저장" : "변경사항 없음"}
        </button>
      </div>
    </div>
  );
}

/* ── Loan eligibility ────────────────────────────────────────── */

interface LoanCheckResult {
  name: string;
  icon: string;
  eligible: boolean;
  reason: string;
}

function checkLoanEligibility(
  groom: PersonAsset,
  bride: PersonAsset
): LoanCheckResult[] {
  const combined = combinedAnnualIncome(groom, bride);
  const bothHomeless = groom.isHomeless && bride.isHomeless;
  const eitherFirst = groom.isFirstHome || bride.isFirstHome;
  const avgNet = Math.max(groom.netAssets, bride.netAssets);

  const results: LoanCheckResult[] = [];

  // 디딤돌 대출
  const didimIncomeOk = combined <= 8500; // 신혼부부 8,500만
  const didimHomeless = bothHomeless;
  const didimNet = avgNet <= 46900; // 4.69억
  results.push({
    name: "디딤돌 대출",
    icon: "🏠",
    eligible: didimIncomeOk && didimHomeless && didimNet,
    reason: [
      `부부합산 연소득 ${formatWon(combined)} ${didimIncomeOk ? "≤ 8,500만" : "> 8,500만 ✗"}`,
      `무주택 ${didimHomeless ? "충족" : "미충족 ✗"}`,
      `순자산 ${formatWon(avgNet)} ${didimNet ? "≤ 4억 6,900만" : "> 4억 6,900만 ✗"}`,
    ].join(" · "),
  });

  // 보금자리론
  const bogumIncomeOk = combined <= 7000;
  results.push({
    name: "보금자리론",
    icon: "🏡",
    eligible: bogumIncomeOk && bothHomeless,
    reason: [
      `부부합산 연소득 ${formatWon(combined)} ${bogumIncomeOk ? "≤ 7,000만" : "> 7,000만 ✗"}`,
      `무주택 ${bothHomeless ? "충족" : "미충족 ✗"}`,
      "주택가격 6억 이하 조건 별도 확인",
    ].join(" · "),
  });

  // 신생아 특례 대출
  const babyIncomeOk = combined <= 13000;
  results.push({
    name: "신생아 특례 대출",
    icon: "👶",
    eligible: babyIncomeOk && bothHomeless,
    reason: [
      `부부합산 연소득 ${formatWon(combined)} ${babyIncomeOk ? "≤ 1.3억" : "> 1.3억 ✗"}`,
      `무주택 ${bothHomeless ? "충족" : "미충족 ✗"}`,
      "출산 2년 이내 조건 별도 확인",
    ].join(" · "),
  });

  // 생애최초 특별 공급
  results.push({
    name: "생애최초 특별공급",
    icon: "🌟",
    eligible: eitherFirst && bothHomeless,
    reason: [
      `생애최초 ${eitherFirst ? "충족" : "미충족 ✗"}`,
      `무주택 ${bothHomeless ? "충족" : "미충족 ✗"}`,
    ].join(" · "),
  });

  return results;
}

function LoanEligibility({
  groom,
  bride,
}: {
  groom: PersonAsset;
  bride: PersonAsset;
}) {
  const checks = checkLoanEligibility(groom, bride);
  const hasData = groom.annualIncome > 0 || bride.annualIncome > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TwEmoji emoji="🏦" size={16} />
        <span className="text-[11px] font-semibold text-mint/70 tracking-[0.2em] uppercase">
          대출 자격 요약
        </span>
      </div>

      {!hasData ? (
        <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-2xl p-8 text-center">
          <div className="text-sm text-white/40">
            소득 정보를 입력하면 대출 자격 여부를 자동으로 확인합니다
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((c) => (
            <div
              key={c.name}
              className={
                "rounded-xl border p-4 transition-colors " +
                (c.eligible
                  ? "bg-emerald-500/5 border-emerald-400/20"
                  : "bg-white/[0.02] border-white/10")
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <TwEmoji emoji={c.icon} size={16} />
                <span className="text-sm font-semibold text-white">
                  {c.name}
                </span>
                <span
                  className={
                    "ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                    (c.eligible
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-400/30"
                      : "bg-white/[0.04] text-white/40 border border-white/10")
                  }
                >
                  {c.eligible ? "가능" : "불가"}
                </span>
              </div>
              <div className="text-[11px] text-white/40 leading-relaxed">
                {c.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared field components ─────────────────────────────────── */

function NumberField({
  label: labelText,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
}) {
  return (
    <div>
      <label className={label}>{labelText}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value || ""}
          onChange={onChange}
          placeholder="0"
          className={input + " pr-10"}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({
  label: labelText,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors"
    >
      <span className="text-[12px] text-white/60">{labelText}</span>
      <span
        className={
          "w-9 h-5 rounded-full relative transition-colors " +
          (checked
            ? "bg-mint/30 border border-mint/50"
            : "bg-white/10 border border-white/20")
        }
      >
        <span
          className={
            "absolute top-0.5 w-4 h-4 rounded-full transition-all " +
            (checked
              ? "left-[18px] bg-mint shadow-[0_0_8px_rgba(0,255,225,0.5)]"
              : "left-0.5 bg-white/40")
          }
        />
      </span>
    </button>
  );
}
