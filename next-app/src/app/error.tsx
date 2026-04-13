"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-[#020806] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15 border border-red-400/30 mb-5">
          <span className="text-3xl" role="img" aria-label="에러">
            !
          </span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-white/50 leading-relaxed mb-6">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="h-11 px-6 rounded-lg text-xs font-semibold bg-mint text-gray-900 hover:bg-mint/90 active:scale-[0.98] transition-all shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
