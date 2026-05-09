"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
  className?: string;
  endpoint?: string;
};

const STAT_LABELS: { key: keyof SummaryStats; label: string }[] = [
  { key: "jobs_completed_today", label: "Jobs today" },
  { key: "draft_invoices", label: "Draft invoices" },
  { key: "quotes_to_followup", label: "Quotes to nudge" },
  { key: "unlinked_receipts", label: "Loose receipts" },
];

export function GhostSummary({
  className,
  endpoint = "/api/brain/summary",
}: Props) {
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
        // Hide the card silently per spec — never show an error here.
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
      className={cn(
        "rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 shadow-sm p-5 sm:p-6",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl">
          👻
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Ghost Summary
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            End-of-day check-in from your AI admin
          </p>
        </div>
      </header>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            <div className="h-3 rounded-full bg-slate-200/70 animate-pulse w-full" />
            <div className="h-3 rounded-full bg-slate-200/70 animate-pulse w-11/12" />
            <div className="h-3 rounded-full bg-slate-200/70 animate-pulse w-9/12" />
          </div>
        ) : (
          <p className="text-base sm:text-[17px] leading-relaxed text-slate-800">
            {data?.summary}
          </p>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {STAT_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-2xl bg-white border border-slate-200 px-3 py-2.5"
          >
            <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {label}
            </dt>
            <dd className="mt-0.5 text-2xl font-bold text-slate-950 tabular-nums">
              {loading ? (
                <span className="inline-block w-6 h-6 rounded bg-slate-200 animate-pulse" />
              ) : (
                (data?.stats?.[key] ?? 0)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
