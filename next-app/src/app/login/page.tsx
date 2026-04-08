"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TwEmoji from "../components/ui/TwEmoji";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/";

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.replace(from);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#2a1a5c] via-[#3a2370] to-[#1a1140] relative overflow-hidden">
      {/* Decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#8ee5d5]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full bg-[#a78bfa]/10 blur-3xl"
      />

      <div className="relative min-h-[100dvh] flex flex-col md:flex-row items-center justify-center px-5 py-10 md:gap-16 md:px-10 max-w-6xl mx-auto">
        {/* ── Hero (compact on mobile, full on desktop) ── */}
        <div className="w-full md:flex-1 flex flex-col items-center md:items-start text-center md:text-left mb-8 md:mb-0">
          {/* Decorative emoji orb */}
          <div className="relative mb-5 md:mb-8">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8ee5d5]/30 to-[#a78bfa]/20 blur-xl"
            />
            <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(142,229,213,0.4)]">
              <TwEmoji
                emoji="💍"
                size={40}
                className="md:hidden"
              />
              <TwEmoji
                emoji="💍"
                size={72}
                className="hidden md:block"
              />
            </div>
          </div>

          {/* Brand tag */}
          <div className="text-[10px] md:text-xs font-semibold text-white/50 tracking-[0.25em] uppercase mb-2">
            Wedding Plan
          </div>

          {/* Main heading — hidden on mobile to save space */}
          <h1 className="hidden md:block text-3xl lg:text-4xl font-bold text-white leading-[1.2] mb-4 max-w-md">
            신랑 광주 × 신부 서울,
            <br />
            완벽한 웨딩홀 찾기
          </h1>

          {/* Mobile short heading */}
          <h1 className="md:hidden text-xl font-semibold text-white leading-tight mb-1">
            웨딩홀 비교 리스트
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] md:text-sm text-white/50 max-w-xs leading-relaxed">
            두 도시를 잇는 최적의 장소를 함께 찾고 계획하세요
          </p>
        </div>

        {/* ── Form card ── */}
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
            로그인
          </h2>
          <p className="text-[12px] text-white/50 mb-6">
            두 분만 입장할 수 있습니다
          </p>

          {/* ID */}
          <div className="mb-4">
            <label
              htmlFor="login-id"
              className="block text-[11px] font-medium text-white/70 mb-2 tracking-wide"
            >
              아이디
            </label>
            <div className="relative">
              <input
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                placeholder="wed1 또는 wed2"
                required
                className="w-full h-12 pl-4 pr-12 text-base bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#8ee5d5]/60 focus:bg-white/[0.08] transition-colors"
              />
              <div
                aria-hidden
                className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50"
              >
                <TwEmoji emoji="👤" size={18} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="login-password"
              className="block text-[11px] font-medium text-white/70 mb-2 tracking-wide"
            >
              비밀번호
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full h-12 pl-4 pr-12 text-base bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#8ee5d5]/60 focus:bg-white/[0.08] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                className="absolute inset-y-0 right-2 flex items-center px-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                <TwEmoji emoji={showPassword ? "🙈" : "👁️"} size={18} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-[13px] text-rose-200 bg-rose-500/10 border border-rose-400/20 px-3.5 py-3 rounded-xl mb-5">
              <TwEmoji
                emoji="⚠️"
                size={14}
                className="flex-shrink-0 mt-0.5"
              />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#8ee5d5] text-[#1a1140] rounded-xl text-base font-semibold tracking-tight transition-all hover:bg-[#a3ece0] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(142,229,213,0.5)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#1a1140]/30 border-t-[#1a1140] rounded-full animate-spin" />
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </button>

          {/* Hint */}
          <p className="text-center text-[11px] text-white/40 mt-6 leading-relaxed">
            지정된 계정으로만 접근 가능합니다
            <br />
            <span className="text-white/60 font-medium">wed1</span>
            {" · "}
            <span className="text-white/60 font-medium">wed2</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
