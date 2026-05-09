"use client";

import * as React from "react";

export type MahiMood = "happy" | "thinking" | "wispy" | "cheer" | "listening";

export interface MahiProps {
  size?: number;
  mood?: MahiMood;
  color?: string;
  accent?: string;
  glow?: boolean;
  hardhat?: boolean;
  eyesOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Mahi({
  size = 64,
  mood = "happy",
  color = "#FFFFFF",
  accent = "var(--accent)",
  glow = false,
  hardhat = false,
  eyesOpen = true,
  className,
  style,
}: MahiProps) {
  const resolvedAccent = accent === "var(--accent)" ? "#FF5E4D" : accent;

  const isListening = mood === "listening";
  const visualMood: Exclude<MahiMood, "listening"> = isListening ? "happy" : mood;

  const bodyOpacity = visualMood === "wispy" ? 0.6 : 1;
  const eyeShift = visualMood === "thinking" ? 1.6 : 0;
  const showQ = visualMood === "thinking" || visualMood === "wispy";
  const happy = visualMood === "happy" || visualMood === "cheer";
  const eyeShape = eyesOpen
    ? { rx: 3, ry: happy ? 3.6 : 3 }
    : { rx: 3, ry: 0.5 };

  const colorKey = color.replace("#", "");
  const gradId = `mahi-${visualMood}-${colorKey}`;
  const blushId = `mahi-blush-${visualMood}-${colorKey}`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      {(glow || isListening) && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -size * 0.22,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${resolvedAccent}55 0%, transparent 65%)`,
            filter: "blur(8px)",
            pointerEvents: "none",
            animation: isListening ? "agFadeIn 1.2s ease-in-out infinite alternate" : undefined,
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={bodyOpacity} />
            <stop
              offset="100%"
              stopColor={color}
              stopOpacity={visualMood === "wispy" ? 0.3 : bodyOpacity * 0.85}
            />
          </linearGradient>
          <radialGradient id={blushId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={resolvedAccent} stopOpacity="0.7" />
            <stop offset="100%" stopColor={resolvedAccent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="32" cy="60" rx="18" ry="2.4" fill="rgba(11,18,32,0.18)" />

        <path
          d="M32 6 C18 6 10 16 10 30 L10 54 C10 56 12 57 13.6 55.6 L18 52 C19.4 50.7 21.4 50.7 22.8 52 L26.2 55 C27.6 56.3 29.6 56.3 31 55 L33 53 C34.4 51.7 36.4 51.7 37.8 53 L41.4 56 C42.8 57.3 44.8 57.3 46.2 56 L50 52.5 C51.6 51 54 52 54 54.2 L54 30 C54 16 46 6 32 6 Z"
          fill={`url(#${gradId})`}
          stroke="rgba(11,18,32,0.08)"
          strokeWidth="0.8"
        />

        <ellipse cx="22" cy="18" rx="6" ry="3.5" fill="#fff" opacity="0.35" />

        {happy && (
          <>
            <circle cx="19" cy="36" r="4" fill={`url(#${blushId})`} />
            <circle cx="45" cy="36" r="4" fill={`url(#${blushId})`} />
          </>
        )}

        <ellipse cx={24 + eyeShift} cy="29" rx={eyeShape.rx} ry={eyeShape.ry} fill="#0B1220" />
        <ellipse cx={40 + eyeShift} cy="29" rx={eyeShape.rx} ry={eyeShape.ry} fill="#0B1220" />

        {eyesOpen && happy && (
          <>
            <circle cx={25 + eyeShift} cy="28" r="0.9" fill="#fff" />
            <circle cx={41 + eyeShift} cy="28" r="0.9" fill="#fff" />
          </>
        )}

        {visualMood === "happy" && (
          <path
            d="M27 38 Q32 43 37 38"
            stroke="#0B1220"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {visualMood === "cheer" && (
          <path d="M26 37 Q32 45 38 37 Q35 41 32 41 Q29 41 26 37 Z" fill="#0B1220" />
        )}
        {visualMood === "thinking" && (
          <path
            d="M28 39 Q32 37 36 39"
            stroke="#0B1220"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {visualMood === "wispy" && (
          <ellipse cx="32" cy="39" rx="2.4" ry="1.6" fill="#0B1220" />
        )}

        {hardhat && (
          <g>
            <ellipse cx="32" cy="14" rx="16" ry="3" fill="#1a1a1a" />
            <path d="M16 14 C16 7 22 3 32 3 C42 3 48 7 48 14 Z" fill={resolvedAccent} />
            <rect x="29" y="3" width="6" height="11" fill="rgba(0,0,0,0.18)" />
            <ellipse cx="22" cy="10" rx="3" ry="1.5" fill="#fff" opacity="0.35" />
          </g>
        )}
      </svg>

      {showQ && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -size * 0.12,
            right: -size * 0.18,
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: "50%",
            background: "var(--mahi-yellow)",
            border: "2px solid var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.24,
            fontWeight: 800,
            color: "var(--ink)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
            fontFamily: "system-ui",
          }}
        >
          ?
        </div>
      )}
    </div>
  );
}

export default Mahi;
