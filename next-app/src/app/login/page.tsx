"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TwEmoji from "../components/ui/TwEmoji";
import { AuroraBackground } from "../components/ui/AuroraBackground";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/";

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
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
    <AuroraBackground className="dark px-5 py-12" animationSpeed={30}>
      {/* Glass card — transparent so the aurora shows through */}
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-[440px] bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-10 sm:p-12 border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mint/15 border border-mint/25 mb-4 shadow-[0_0_40px_-8px_rgba(0,255,225,0.4)]">
            <TwEmoji emoji="💍" size={28} />
          </div>
          <h1 className="text-[19px] font-semibold text-white mb-1.5 tracking-tight">
            웨딩홀 비교 리스트
          </h1>
          <p className="text-[13px] text-white/50">로그인하고 계속하기</p>
        </div>

        {/* ID */}
        <div className="mb-7">
          <label
            htmlFor="login-id"
            className="block text-sm font-semibold text-mint mb-2.5"
          >
            아이디
          </label>
          <input
            id="login-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            required
            className="w-full h-[60px] px-6 text-base bg-white/[0.05] border border-white/15 rounded-2xl text-white focus:outline-none focus:border-mint/80 focus:bg-white/[0.08] focus:ring-4 focus:ring-mint/20 transition-all"
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <label
            htmlFor="login-password"
            className="block text-sm font-semibold text-mint mb-2.5"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full h-[60px] px-6 text-base bg-white/[0.05] border border-white/15 rounded-2xl text-white focus:outline-none focus:border-mint/80 focus:bg-white/[0.08] focus:ring-4 focus:ring-mint/20 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 text-[13px] text-red-300 bg-red-500/10 border border-red-400/20 px-5 py-4 rounded-xl mb-5">
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
          className="w-full h-[60px] bg-mint text-gray-900 rounded-2xl text-base font-semibold tracking-tight transition-all hover:bg-mint/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_32px_-4px_rgba(0,255,225,0.6)]"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </button>
      </form>
    </AuroraBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
