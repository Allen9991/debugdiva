"use client";

import * as React from "react";
import Link from "next/link";
import { Mahi, type MahiMood } from "@/components/mahi";

type LoadLevel = "light" | "moderate" | "heavy" | "overloaded";

type LoadFactor = {
  label: string;
  detail: string;
  points: number;
};

type MentalLoadData = {
  level: LoadLevel;
  score: number;
  max_score: number;
  summary: string;
  tips: string[];
  factors: LoadFactor[];
};

const LEVEL_CONFIG: Record<
  LoadLevel,
  { label: string; mood: MahiMood; barColor: string; pillBg: string; pillFg: string; glow: boolean }
> = {
  light: {
    label: "All clear",
    mood: "happy",
    barColor: "#10B981",
    pillBg: "#D1FAE5",
    pillFg: "#065F46",
    glow: false,
  },
  moderate: {
    label: "Building up",
    mood: "thinking",
    barColor: "#F59E0B",
    pillBg: "#FEF3C7",
    pillFg: "#92400E",
    glow: false,
  },
  heavy: {
    label: "Heavy load",
    mood: "wispy",
    barColor: "#F97316",
    pillBg: "#FFEDD5",
    pillFg: "#C2410C",
    glow: false,
  },
  overloaded: {
    label: "Overloaded",
    mood: "wispy",
    barColor: "#EF4444",
    pillBg: "#FEE2E2",
    pillFg: "#991B1B",
    glow: false,
  },
};

const LEVELS: LoadLevel[] = ["light", "moderate", "heavy", "overloaded"];

function SegmentBar({ level }: { level: LoadLevel }) {
  const activeIndex = LEVELS.indexOf(level);
  return (
    <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 4, overflow: "hidden" }}>
      {LEVELS.map((l, i) => (
        <div
          key={l}
          style={{
            flex: 1,
            borderRadius: 3,
            background: i <= activeIndex ? LEVEL_CONFIG[l].barColor : "var(--border)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function TipRow({ tip, index }: { tip: string; index: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 0",
        borderTop: index > 0 ? "1px solid var(--border)" : "none",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--focus-soft)",
          color: "var(--muted)",
          fontSize: 10,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {index + 1}
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>{tip}</p>
    </div>
  );
}

export function MentalLoadMeter() {
  const [data, setData] = React.useState<MentalLoadData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/brain/mental-load")
      .then((r) => r.json())
      .then((d: MentalLoadData) => {
        setData(d);
        if (d.level !== "light") setExpanded(true);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 16,
          background: "#fff",
          border: "1px solid var(--border)",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mahi size={40} mood="thinking" />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 11,
                width: 90,
                borderRadius: 6,
                background: "var(--border)",
                marginBottom: 8,
              }}
            />
            <div
              style={{ height: 6, borderRadius: 3, background: "var(--border)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cfg = LEVEL_CONFIG[data.level];
  const showTips = expanded;

  return (
    <div
      style={{
        borderRadius: 16,
        background: "#fff",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/wellbeing"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "var(--muted)",
            textDecoration: "none",
          }}
        >
          Mental Load ↗
        </Link>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: cfg.pillBg,
            color: cfg.pillFg,
            letterSpacing: 0.3,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Meter body */}
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Mahi size={44} mood={cfg.mood} glow={cfg.glow} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--ink)",
              }}
            >
              {data.summary}
            </p>
            <SegmentBar level={data.level} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 5,
              }}
            >
              <span style={{ fontSize: 10, color: "var(--faint)", fontWeight: 600 }}>
                Light
              </span>
              <span style={{ fontSize: 10, color: "var(--faint)", fontWeight: 600 }}>
                Overloaded
              </span>
            </div>
          </div>
        </div>

        {/* Tips toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0 0",
            borderTop: "1px solid var(--border)",
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span>Ghostly&apos;s tips</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {showTips && (
          <div style={{ marginTop: 4 }}>
            {data.tips.map((tip, i) => (
              <TipRow key={i} tip={tip} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
