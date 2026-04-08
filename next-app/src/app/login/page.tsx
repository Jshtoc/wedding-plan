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
    <div className="min-h-screen flex items-center justify-center p-5 bg-[var(--bg)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[360px] bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      >
        <div className="text-center mb-6">
          <div className="text-[22px] font-semibold text-[var(--ink)] mb-1.5">
            <TwEmoji emoji="💍" size={22} /> 웨딩홀 비교 리스트
          </div>
          <div className="text-xs text-[var(--ink2)]">로그인이 필요합니다</div>
        </div>

        <label className="block text-xs text-[var(--ink2)] mb-1.5">아이디</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
          required
          className="w-full px-3 py-2.5 border border-[var(--border)] rounded-[10px] mb-3.5 text-sm bg-white text-[var(--ink)]"
        />

        <label className="block text-xs text-[var(--ink2)] mb-1.5">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full px-3 py-2.5 border border-[var(--border)] rounded-[10px] mb-3.5 text-sm bg-white text-[var(--ink)]"
        />

        {error && (
          <div className="text-xs text-[var(--red)] bg-[var(--red-light)] px-2.5 py-2 rounded-lg mb-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3.5 py-3 bg-[var(--ink)] text-white border-none rounded-[10px] text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
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
