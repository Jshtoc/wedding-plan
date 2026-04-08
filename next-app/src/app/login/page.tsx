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
    <div className="min-h-[100dvh] bg-gradient-to-br from-night via-royal to-night relative overflow-hidden flex items-center justify-center px-5 py-12">
      {/* Decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-mint/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-royal/60 blur-3xl"
      />

      {/* ── Form card ── */}
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md bg-royal/30 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
      >
        {/* Brand orb */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-mint/25 blur-xl"
            />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_16px_40px_-12px_rgba(142,229,213,0.5)]">
              <TwEmoji emoji="💍" size={36} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-9">
          <div className="text-[10px] font-semibold text-mint/70 tracking-[0.3em] uppercase mb-2.5">
            Wedding Plan
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">로그인</h1>
          <p className="text-[13px] text-white/50 leading-relaxed">
            지정된 두 계정으로만 입장할 수 있습니다
          </p>
        </div>

        {/* ID */}
        <div className="mb-6">
          <label
            htmlFor="login-id"
            className="block text-[11px] font-medium text-white/70 mb-2.5 tracking-wide"
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
              className="w-full h-12 pl-4 pr-12 text-base bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-mint/60 focus:bg-white/[0.08] transition-colors"
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
        <div className="mb-8">
          <label
            htmlFor="login-password"
            className="block text-[11px] font-medium text-white/70 mb-2.5 tracking-wide"
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
              className="w-full h-12 pl-4 pr-12 text-base bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-mint/60 focus:bg-white/[0.08] transition-colors"
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
          <div className="flex items-start gap-2 text-[13px] text-rose-200 bg-rose-500/10 border border-rose-400/20 px-4 py-3 rounded-xl mb-6">
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
          className="w-full h-12 bg-mint text-night rounded-xl text-base font-semibold tracking-tight transition-all hover:bg-mint/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(142,229,213,0.5)]"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-night/30 border-t-night rounded-full animate-spin" />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </button>

        {/* Hint */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40 leading-relaxed">
            사용 가능한 계정
          </p>
          <p className="text-[12px] text-white/70 font-medium mt-1.5 tracking-wide">
            wed1 <span className="text-white/30 mx-1.5">·</span> wed2
          </p>
        </div>
      </form>
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
