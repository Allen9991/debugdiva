"use client";

import * as React from "react";
import Link from "next/link";
import { Mahi, type MahiMood } from "@/components/mahi";


type BurnoutRisk = "on_track" | "watch" | "at_risk" | "overloaded";

type ForecastData = {
  risk: BurnoutRisk;
  logged_hours: number;
  pipeline_hours: number;
  projected_total: number;
  max_weekly_hours: number;
  utilization_pct: number;
  days_remaining: number;
  hours_per_day_remaining: number;
  summary: string;
  tips: string[];
};

const RISK_CONFIG: Record<
  BurnoutRisk,
  { label: string; mood: MahiMood; pillBg: string; pillFg: string; barColor: string; trackColor: string }
> = {
  on_track: {
    label: "On track",
    mood: "happy",
    pillBg: "#D1FAE5",
    pillFg: "#065F46",
    barColor: "#10B981",
    trackColor: "#A7F3D0",
  },
  watch: {
    label: "Watch",
    mood: "thinking",
    pillBg: "#FEF3C7",
    pillFg: "#92400E",
    barColor: "#F59E0B",
    trackColor: "#FDE68A",
  },
  at_risk: {
    label: "At risk",
    mood: "wispy",
    pillBg: "#FFEDD5",
    pillFg: "#C2410C",
    barColor: "#F97316",
    trackColor: "#FED7AA",
  },
  overloaded: {
    label: "Overloaded",
    mood: "wispy",
    pillBg: "#FEE2E2",
    pillFg: "#991B1B",
    barColor: "#EF4444",
    trackColor: "#FECACA",
  },
};

function WeekBar({
  logged,
  pipeline,
  max,
  barColor,
  trackColor,
}: {
  logged: number;
  pipeline: number;
  max: number;
  barColor: string;
  trackColor: string;
}) {
  const loggedPct = Math.min(100, (logged / max) * 100);
  const pipelinePct = Math.min(100 - loggedPct, (pipeline / max) * 100);

  return (
    <div>
      <div
        style={{
          height: 10,
          borderRadius: 6,
          background: "var(--border)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${loggedPct}%`,
            background: barColor,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${loggedPct}%`,
            top: 0,
            bottom: 0,
            width: `${pipelinePct}%`,
            background: trackColor,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <LegendDot color={barColor} label={`${logged} hrs logged`} />
          <LegendDot color={trackColor} label={`${pipeline} hrs pipeline`} />
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
          {max} hr max
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{label}</span>
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

export function WorkloadForecast() {
  const [data, setData] = React.useState<ForecastData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/brain/workload-forecast")
      .then((r) => r.json())
      .then((d: ForecastData) => {
        setData(d);
        if (d.risk !== "on_track") setExpanded(true);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ borderRadius: 16, background: "#fff", border: "1px solid var(--border)", padding: 18 }}>
        <div style={{ height: 11, width: 140, borderRadius: 6, background: "var(--border)", marginBottom: 12 }} />
        <div style={{ height: 10, borderRadius: 6, background: "var(--border)" }} />
      </div>
    );
  }

  if (!data) return null;

  const cfg = RISK_CONFIG[data.risk];

  return (
    <div style={{ borderRadius: 16, background: "#fff", border: "1px solid var(--border)", overflow: "hidden" }}>
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
          style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)", textDecoration: "none" }}
        >
          Workload Forecast ↗
        </Link>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: cfg.pillBg,
            color: cfg.pillFg,
          }}
        >
          {cfg.label}
        </span>
      </div>

      <div style={{ padding: "14px 18px" }}>
        {/* Mahi + summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Mahi size={44} mood={cfg.mood} />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink)", flex: 1 }}>
            {data.summary}
          </p>
        </div>

        {/* Week bar */}
        <WeekBar
          logged={data.logged_hours}
          pipeline={data.pipeline_hours}
          max={data.max_weekly_hours}
          barColor={cfg.barColor}
          trackColor={cfg.trackColor}
        />

        {/* Sub-stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <StatChip
            label="Projected"
            value={`${data.projected_total} hrs`}
            sub={`${data.utilization_pct}% of limit`}
          />
          <StatChip
            label="Days left"
            value={data.days_remaining === 0 ? "Done" : `${data.days_remaining} day${data.days_remaining === 1 ? "" : "s"}`}
            sub={data.days_remaining > 0 ? `~${data.hours_per_day_remaining} hrs/day capacity` : "Week closed out"}
          />
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
            padding: "10px 0 0",
            marginTop: 4,
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
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {expanded && (
          <div style={{ marginTop: 4 }}>
            {data.tips.map((tip, i) => (
              <TipRow key={i} tip={tip} index={i} />
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <Link
                href="/settings"
                style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}
              >
                Adjust work preferences →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--focus-soft)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--muted)", marginBottom: 3 }}>
        {label}
      </div>
      <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{sub}</div>
    </div>
  );
}
