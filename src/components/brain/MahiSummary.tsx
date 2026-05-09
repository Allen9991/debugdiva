"use client";

import { useEffect, useState } from "react";
import { Mahi } from "@/components/mahi";
import { Pill, MahiTag } from "@/components/ui/primitives";

type SummaryStats = {
  jobs_completed_today: number;
  draft_invoices: number;
  quotes_to_followup: number;
  unlinked_receipts: number;
};

type SummaryResponse = {
  summary: string;
  stats: SummaryStats;
  generated_at: string;
};

type Props = {
  endpoint?: string;
};

export function MahiSummary({ endpoint = "/api/brain/summary" }: Props) {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(`summary failed (${res.status})`);
        const json = (await res.json()) as SummaryResponse;
        if (cancelled) return;
        setData(json);
      } catch {
        if (!cancelled) setHidden(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (hidden) return null;

  return (
    <section
      aria-label="End of day summary"
      style={{
        background: "#FFFBEB",
        border: "1px solid var(--amber-border)",
        borderRadius: "var(--radius-card-lg)",
        padding: 18,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <Mahi size={48} mood={loading ? "thinking" : "happy"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MahiTag />
            <Pill tone="emerald">● Live</Pill>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }} aria-busy>
              <div style={{ height: 10, width: "100%", borderRadius: 999, background: "rgba(146,64,14,0.12)", animation: "agFadeIn 1.2s ease-in-out infinite alternate" }} />
              <div style={{ height: 10, width: "92%", borderRadius: 999, background: "rgba(146,64,14,0.12)", animation: "agFadeIn 1.2s ease-in-out infinite alternate" }} />
              <div style={{ height: 10, width: "70%", borderRadius: 999, background: "rgba(146,64,14,0.12)", animation: "agFadeIn 1.2s ease-in-out infinite alternate" }} />
            </div>
          ) : (
            <p
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                lineHeight: 1.5,
                color: "var(--amber-fg-dark)",
                margin: 0,
              }}
            >
              {data?.summary}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
