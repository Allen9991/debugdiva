"use client";

import * as React from "react";
import { Mahi } from "@/components/mahi";

type TomorrowItem = {
  label: string;
  priority: "high" | "medium" | "low";
};

type WindDownData = {
  celebration: string;
  tomorrow_list: TomorrowItem[];
  stats: {
    jobs_completed_week: number;
    revenue_invoiced_week: number;
    new_bookings_week: number;
  };
};

const PRIORITY_DOT: Record<TomorrowItem["priority"], string> = {
  high: "#F59E0B",
  medium: "var(--accent)",
  low: "#10B981",
};

function formatNzd(n: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
  }).format(n);
}

export function WindDown() {
  const [data, setData] = React.useState<WindDownData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [clockedOff, setClockedOff] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/brain/wind-down")
      .then((r) => r.json())
      .then((d: WindDownData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 18,
          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
          border: "1px solid #FDE68A",
          padding: 22,
        }}
      >
        <div style={{ height: 14, width: 180, borderRadius: 6, background: "#FDE68A", marginBottom: 10 }} />
        <div style={{ height: 10, borderRadius: 6, background: "#FDE68A" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      style={{
        borderRadius: 18,
        background: clockedOff
          ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
          : "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
        border: `1px solid ${clockedOff ? "#6EE7B7" : "#FDE68A"}`,
        overflow: "hidden",
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px 16px",
          borderBottom: `1px solid ${clockedOff ? "#A7F3D0" : "#FDE68A"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: clockedOff ? "#065F46" : "#92400E",
              marginBottom: 2,
            }}
          >
            Wind Down
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: -0.3 }}>
            {clockedOff ? "You're done for the day." : "Here's what you achieved."}
          </div>
        </div>
        <Mahi size={52} mood={clockedOff ? "cheer" : "happy"} accent="#F59E0B" />
      </div>

      <div style={{ padding: "18px 22px" }}>
        {/* Stats row */}
        {(data.stats.jobs_completed_week > 0 || data.stats.revenue_invoiced_week > 0) && !clockedOff && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {data.stats.jobs_completed_week > 0 && (
              <StatBubble
                value={String(data.stats.jobs_completed_week)}
                label={`job${data.stats.jobs_completed_week === 1 ? "" : "s"} done`}
              />
            )}
            {data.stats.revenue_invoiced_week > 0 && (
              <StatBubble
                value={formatNzd(data.stats.revenue_invoiced_week)}
                label="invoiced this week"
              />
            )}
            {data.stats.new_bookings_week > 0 && (
              <StatBubble
                value={String(data.stats.new_bookings_week)}
                label={`new booking${data.stats.new_bookings_week === 1 ? "" : "s"}`}
              />
            )}
          </div>
        )}

        {/* Celebration message */}
        <p
          style={{
            margin: "0 0 18px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--ink)",
            fontWeight: clockedOff ? 600 : 400,
          }}
        >
          {clockedOff
            ? "Rest up. Tomorrow's list is ready when you are."
            : data.celebration}
        </p>

        {/* Tomorrow's list */}
        {!clockedOff && data.tomorrow_list.length > 0 && (
          <div
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,0.65)",
              border: "1px solid #FDE68A",
              padding: "12px 14px",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "#92400E",
                marginBottom: 10,
              }}
            >
              Tomorrow&apos;s 3
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.tomorrow_list.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: PRIORITY_DOT[item.priority],
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink)" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clock off button */}
        <button
          type="button"
          onClick={() => setClockedOff((v) => !v)}
          style={{
            height: 44,
            padding: "0 22px",
            borderRadius: 12,
            border: "none",
            background: clockedOff ? "rgba(255,255,255,0.7)" : "#92400E",
            color: clockedOff ? "#065F46" : "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {clockedOff ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to plan
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clock off for the day
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatBubble({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.65)",
        border: "1px solid #FDE68A",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: -0.3 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#92400E", fontWeight: 600, marginTop: 1 }}>{label}</div>
    </div>
  );
}
