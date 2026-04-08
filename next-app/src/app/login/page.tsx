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
    <div className="min-h-[100dvh] bg-[#f5f5f7] flex items-center justify-center px-5 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 border border-pearl/70 shadow-[0_2px_24px_rgba(15,23,42,0.04)]"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sapphire/10 mb-4">
            <TwEmoji emoji="💍" size={28} />
          </div>
          <h1 className="text-[19px] font-semibold text-gray-900 mb-1.5 tracking-tight">
            웨딩홀 비교 리스트
          </h1>
          <p className="text-[13px] text-gray-500">
            로그인하고 계속하기
          </p>
        </div>

        {/* ID */}
        <div className="mb-6">
          <label
            htmlFor="login-id"
            className="block text-sm font-semibold text-jade mb-2.5"
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
            className="w-full h-14 px-5 text-base bg-white border border-pearl rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sapphire focus:ring-4 focus:ring-sapphire/10 transition-all"
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <label
            htmlFor="login-password"
            className="block text-sm font-semibold text-jade mb-2.5"
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
            className="w-full h-14 px-5 text-base bg-white border border-pearl rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sapphire focus:ring-4 focus:ring-sapphire/10 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-5">
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
          className="w-full h-14 bg-sapphire text-white rounded-2xl text-base font-semibold tracking-tight transition-all hover:bg-sapphire/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.35)]"
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
        <div className="mt-8 pt-6 border-t border-pearl text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            사용 가능한 계정
          </p>
          <p className="text-[13px] font-medium text-gray-700 mt-1.5 tracking-wide">
            wed1 <span className="text-gray-300 mx-1.5">·</span> wed2
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
