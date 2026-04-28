"use client";

import type React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
  /** Animation duration in seconds. Default 60s for subtle movement. Use 10–20 for more visible. */
  animationSpeed?: number;
}

/**
 * AuroraBackground — adapted from Aceternity UI.
 *
 * This project only uses the dark variant (the login page wraps its form
 * in this component). The original Aceternity code supports both light and
 * dark via an `invert` filter + `dark:` variant, but the light path
 * produces red/magenta through its `invert + mix-blend-difference` pipeline
 * which is not what we want. We've hardcoded the dark path: black stripes
 * (`--dark-gradient`) + aurora gradient, no invert.
 */
export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  animationSpeed = 60,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "transition-bg relative flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-900 text-white",
          className
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            {
              "--aurora":
                "repeating-linear-gradient(100deg,#20F547_10%,#10b981_15%,#34d399_20%,#00FFE1_25%,#14b8a6_30%)",
              "--dark-gradient":
                "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",

              "--color-1": "#20F547",
              "--color-2": "#10b981",
              "--color-3": "#34d399",
              "--color-4": "#00FFE1",
              "--color-5": "#14b8a6",
              "--black": "#000",
              "--transparent": "transparent",
              "--animation-speed": `${animationSpeed}s`,
            } as React.CSSProperties
          }
        >
          <div
            className={cn(
              `pointer-events-none absolute -inset-[10px] [background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-50 blur-[6px] filter [--aurora:repeating-linear-gradient(100deg,var(--color-1)_10%,var(--color-2)_15%,var(--color-3)_20%,var(--color-4)_25%,var(--color-5)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]`,
              showRadialGradient &&
                "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]"
            )}
          />
        </div>
        {children}
      </div>
    </main>
  );
};

export default AuroraBackground;
