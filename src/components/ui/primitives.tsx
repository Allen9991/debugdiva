"use client";

import * as React from "react";

type PillTone =
  | "ink"
  | "soft"
  | "amber"
  | "emerald"
  | "red"
  | "accent"
  | "outline";

const pillTones: Record<PillTone, React.CSSProperties> = {
  ink: { background: "var(--ink)", color: "#fff" },
  soft: { background: "var(--focus-soft)", color: "var(--ink)" },
  amber: { background: "var(--amber-bg)", color: "var(--amber-fg)" },
  emerald: { background: "var(--emerald-bg)", color: "var(--emerald-fg)" },
  red: { background: "#FEE2E2", color: "#991B1B" },
  accent: { background: "var(--accent-soft)", color: "var(--accent)" },
  outline: {
    background: "transparent",
    color: "var(--ink)",
    border: "1px solid var(--border-strong)",
  },
};

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

export function Pill({ tone = "ink", style, children, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--radius-pill)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.1,
        whiteSpace: "nowrap",
        ...pillTones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Eyebrow({ style, children, ...rest }: EyebrowProps) {
  return (
    <div
      {...rest}
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.4,
        color: "var(--muted)",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number | string;
  radius?: number | string;
}

export function Card({
  padding = 18,
  radius = "var(--radius-card-lg)",
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background: "var(--surface)",
        borderRadius: radius,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
  dark?: boolean;
}

export function PrimaryButton({
  full,
  dark = true,
  style,
  children,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      style={{
        height: 56,
        padding: "0 20px",
        width: full ? "100%" : undefined,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        background: dark ? "var(--ink)" : "#fff",
        color: dark ? "#fff" : "var(--ink)",
        fontSize: 16,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: dark ? "0 4px 14px rgba(11,18,32,0.18)" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export interface MahiTagProps {
  size?: number;
  color?: string;
  accent?: string;
  style?: React.CSSProperties;
}

export function MahiTag({
  size = 11,
  color = "var(--ink)",
  accent = "var(--accent)",
  style,
}: MahiTagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 0.4,
        color,
        textTransform: "uppercase",
        ...style,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: accent,
        }}
      />
      Ghostly
    </span>
  );
}

export interface HoldToSendProps {
  label?: string;
  onComplete?: () => void;
  duration?: number;
  accent?: string;
  disabled?: boolean;
}

export function HoldToSend({
  label = "Hold to approve & send",
  onComplete,
  duration = 900,
  accent = "var(--accent)",
  disabled = false,
}: HoldToSendProps) {
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const ref = React.useRef({ raf: 0, start: 0, holding: false });

  const start = () => {
    if (done || disabled) return;
    ref.current.holding = true;
    ref.current.start = performance.now();
    const tick = () => {
      if (!ref.current.holding) return;
      const elapsed = performance.now() - ref.current.start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        setDone(true);
        ref.current.holding = false;
        onComplete?.();
        return;
      }
      ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    ref.current.holding = false;
    cancelAnimationFrame(ref.current.raf);
    if (!done) setProgress(0);
  };

  React.useEffect(() => () => cancelAnimationFrame(ref.current.raf), []);

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      disabled={disabled}
      style={{
        position: "relative",
        overflow: "hidden",
        height: 60,
        width: "100%",
        borderRadius: 14,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: "var(--ink)",
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        boxShadow: "0 6px 20px rgba(11,18,32,0.25)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}dd)`,
          transition: progress === 0 ? "width 200ms ease-out" : "none",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {done ? (
          <>✓&nbsp;Sent</>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l4 4L19 6"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {label}
          </>
        )}
      </span>
    </button>
  );
}
