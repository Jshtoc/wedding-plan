"use client";

import { createContext, useCallback, useContext, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   LoadingOverlay — global full-screen spinner + dimmed backdrop.
   Wrap the app in <LoadingProvider> and call useLoading() from
   any descendant:
     const loading = useLoading();
     loading.show();   // show spinner
     loading.hide();   // hide spinner
     await loading.wrap(asyncFn());  // auto show/hide around a promise
   ═══════════════════════════════════════════════════════════════ */

interface LoadingContextValue {
  show: () => void;
  hide: () => void;
  wrap: <T>(promise: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be inside <LoadingProvider>");
  return ctx;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const visible = count > 0;

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const wrap = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      show();
      try {
        return await promise;
      } finally {
        hide();
      }
    },
    [show, hide]
  );

  return (
    <LoadingContext.Provider value={{ show, hide, wrap }}>
      {children}
      {visible && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin w-10 h-10 text-mint"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="로딩 중"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.2"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-white/60">잠시만 기다려주세요</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
