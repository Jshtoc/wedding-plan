"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import TwEmoji from "./TwEmoji";

/* ═══════════════════════════════════════════════════════════════
   ConfirmModal — replaces native alert() / confirm() with a
   dark-themed in-app modal. Provides two hooks:
     • useAlert()   → show(message) → Promise<void>
     • useConfirm() → show(message) → Promise<boolean>

   Wrap the app (or a subtree) in <ConfirmProvider> and call the
   hooks from any descendant.
   ═══════════════════════════════════════════════════════════════ */

type ModalType = "alert" | "confirm";

interface ModalState {
  type: ModalType;
  message: string;
  title?: string;
  icon?: string;
  /** "danger" uses red accent for the confirm button. */
  variant?: "default" | "danger";
}

interface ConfirmContextValue {
  alert: (
    message: string,
    opts?: { title?: string; icon?: string }
  ) => Promise<void>;
  confirm: (
    message: string,
    opts?: { title?: string; icon?: string; variant?: "default" | "danger" }
  ) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useAlert() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useAlert must be inside <ConfirmProvider>");
  return ctx.alert;
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be inside <ConfirmProvider>");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setModal(null);
  }, []);

  const alert = useCallback(
    (message: string, opts?: { title?: string; icon?: string }) =>
      new Promise<void>((resolve) => {
        resolveRef.current = () => resolve();
        setModal({ type: "alert", message, ...opts });
      }),
    []
  );

  const confirm = useCallback(
    (
      message: string,
      opts?: { title?: string; icon?: string; variant?: "default" | "danger" }
    ) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setModal({ type: "confirm", message, ...opts });
      }),
    []
  );

  return (
    <ConfirmContext.Provider value={{ alert, confirm }}>
      {children}
      {modal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-3xl bg-[#0b0f14] border border-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className={
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center " +
                  (modal.variant === "danger"
                    ? "bg-red-500/15 border border-red-400/30"
                    : "bg-mint/10 border border-mint/25")
                }
              >
                <TwEmoji
                  emoji={
                    modal.icon ||
                    (modal.variant === "danger" ? "⚠️" : "💬")
                  }
                  size={20}
                />
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="text-base font-semibold text-white">
                  {modal.title ||
                    (modal.type === "alert" ? "알림" : "확인")}
                </h3>
              </div>
            </div>

            {/* Message */}
            <div className="text-[13px] text-white/70 leading-relaxed mb-6 pl-[52px]">
              {modal.message}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2">
              {modal.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="h-10 px-5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  "h-10 px-5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] " +
                  (modal.variant === "danger"
                    ? "bg-red-500/20 text-red-100 border border-red-400/40 hover:bg-red-500/30"
                    : "bg-mint text-gray-900 hover:bg-mint/90 shadow-[0_6px_20px_-6px_rgba(0,255,225,0.5)]")
                }
              >
                {modal.type === "alert"
                  ? "확인"
                  : modal.variant === "danger"
                    ? "삭제"
                    : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
