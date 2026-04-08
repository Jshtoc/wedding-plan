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
    <div className="min-h-[100dvh] flex items-center justify-center px-5 py-10 bg-gradient-to-b from-[var(--bg)] via-[var(--gold-light)]/40 to-[var(--bg)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-3xl p-7 sm:p-8 shadow-[0_12px_40px_-12px_rgba(26,23,20,0.15)]"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--gold-light)] mb-5">
            <TwEmoji emoji="💍" size={32} />
          </div>
          <h1 className="text-[22px] sm:text-2xl font-semibold text-[var(--ink)] tracking-tight mb-1.5">
            웨딩홀 비교 리스트
          </h1>
          <p className="text-[13px] text-[var(--ink2)]">
            로그인하고 계속하기
          </p>
        </div>

        {/* ID */}
        <div className="mb-4">
          <label
            htmlFor="login-id"
            className="block text-xs font-medium text-[var(--ink2)] mb-2 ml-0.5"
          >
            아이디
          </label>
          <input
            id="login-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            placeholder="wed1 또는 wed2"
            required
            className="w-full h-12 px-4 text-base bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--ink)] placeholder:text-[var(--ink3)] focus:outline-none focus:border-[var(--gold)] focus:bg-white transition-colors"
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-[var(--ink2)] mb-2 ml-0.5"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="w-full h-12 px-4 text-base bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--ink)] placeholder:text-[var(--ink3)] focus:outline-none focus:border-[var(--gold)] focus:bg-white transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-[13px] text-[var(--red)] bg-[var(--red-light)] border border-[var(--red)]/20 px-3.5 py-3 rounded-xl mb-4">
            <TwEmoji emoji="⚠️" size={14} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[var(--ink)] text-white rounded-xl text-base font-medium transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </button>

        {/* Hint */}
        <p className="text-center text-[11px] text-[var(--ink3)] mt-6 leading-relaxed">
          두 계정으로만 로그인할 수 있습니다
          <br />
          <span className="text-[var(--ink2)] font-medium">wed1</span>
          {" · "}
          <span className="text-[var(--ink2)] font-medium">wed2</span>
        </p>
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
