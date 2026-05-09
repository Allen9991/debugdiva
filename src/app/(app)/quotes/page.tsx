"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/types";
import { QuoteDraftView } from "@/components/output/QuoteDraftView";
import { Pill } from "@/components/ui/primitives";

type JobOption = {
  id: string;
  client_name: string;
  location: string;
  description: string;
  status: string;
};

type QuoteSummary = {
  id: string;
  job_id: string;
  client_name: string;
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  expires_at: string;
  created_at: string;
  location?: string;
  description?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function QuotesPage() {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [jobQuery, setJobQuery] = useState("");
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      console.log("[QuotesPage] loading jobs + quotes");
      try {
        const [jobsRes, quotesRes] = await Promise.all([
          fetch("/api/jobs", { cache: "no-store" }),
          fetch("/api/quotes", { cache: "no-store" }),
        ]);
        const jobsJson = await jobsRes.json();
        const quotesJson = await quotesRes.json();
        if (cancelled) return;
        const jobList: JobOption[] = jobsJson.jobs ?? [];
        setJobs(jobList);
        if (jobList.length > 0) setSelectedJob(jobList[0].id);
        setQuotes(quotesJson.quotes ?? []);
        console.log("[QuotesPage] loaded", jobList.length, "jobs and", (quotesJson.quotes ?? []).length, "quotes");
      } catch (err) {
        console.error("[QuotesPage] load failed:", err);
        if (!cancelled) setError("Couldn't load jobs or quotes.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const createQuote = async () => {
    console.log("[QuotesPage] Create quote clicked, job_id:", selectedJob);
    if (!selectedJob) {
      setError("Pick a job first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJob }),
      });
      const data = await res.json();
      console.log("[QuotesPage] /api/quotes response:", data);
      if (!res.ok) throw new Error(data?.error ?? "Failed to create quote");
      setActiveQuote(data.quote);
      setWarnings(data.warnings ?? []);
    } catch (err) {
      console.error("[QuotesPage] createQuote threw:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (updated: Quote) => {
    console.log("[QuotesPage] Send quote clicked, id:", updated.id);
    const res = await fetch("/api/output/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: updated.id, document_type: "quote" }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error ?? "Failed to send");
    }
  };

  const deleteQuote = async (id: string) => {
    const res = await fetch("/api/quotes?id=" + id, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Could not delete this quote.");
      return;
    }
    setQuotes((current) => current.filter((quote) => quote.id !== id));
  };

  if (activeQuote) {
    return (
      <QuoteDraftView quote={activeQuote} warnings={warnings} onApproveAndSend={handleSend} />
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22, display: "grid", gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Create a quote</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
            Pick the job you want to quote. We&rsquo;ll draft labour, materials, and GST automatically.
          </p>

          <div style={{ display: "grid", gap: 8, position: "relative" }}>
            <label htmlFor="quote-job-search" style={{ fontSize: 13, fontWeight: 600 }}>Search for a job</label>
            <input
              id="quote-job-search"
              value={jobQuery}
              onChange={(e) => {
                setJobQuery(e.target.value);
                setSelectedJob("");
              }}
              placeholder="Search client, address, or job details"
              style={{ height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border, #E2E8F0)", background: "var(--bg, #F8FAFC)", fontSize: 14, color: "var(--ink, #0B1220)", outline: "none" }}
            />
            <div style={{ display: "grid", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {jobs
                .filter((job) => {
                  const q = jobQuery.trim().toLowerCase();
                  if (!q) return true;
                  return [job.client_name, job.location, job.description, job.status].join(" ").toLowerCase().includes(q);
                })
                .slice(0, 8)
                .map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setSelectedJob(job.id);
                      setJobQuery(job.client_name + " - " + (job.location || job.description.slice(0, 40)));
                    }}
                    style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: selectedJob === job.id ? "1px solid var(--accent, #2C7A7B)" : "1px solid var(--border, #E2E8F0)", background: selectedJob === job.id ? "var(--accent-soft, #E0F0EF)" : "#fff", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{job.client_name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 2 }}>{job.location || job.description}</div>
                  </button>
                ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={createQuote}
            disabled={loading || !selectedJob}
            style={{ height: 44, padding: "0 22px", borderRadius: 12, border: "none", background: "var(--accent, #FF5E4D)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !selectedJob ? "not-allowed" : "pointer", opacity: loading || !selectedJob ? 0.6 : 1, justifySelf: "start" }}
          >
            {loading ? "Creating quote..." : "Create quote"}
          </button>
        </section>

        <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>All quotes</div>
            <Pill tone="soft">{quotes.length} on file</Pill>
          </div>

          {quotes.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>No quotes yet. Pick a job above and create one.</p>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {quotes.map((q) => (
              <div
                key={q.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}
              >
                <Link href={"/jobs/" + q.job_id} style={{ flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <Pill tone="soft">{titleCase(q.status)}</Pill>
                    <Pill tone="soft">Expires {q.expires_at}</Pill>
                    <Pill tone="soft">Created {new Date(q.created_at).toLocaleDateString("en-NZ")}</Pill>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{q.client_name}</div>
                  {q.location && (
                    <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 2 }}>{q.location}</div>
                  )}
                </Link>
                <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 800 }}>{money(q.total)}</div>
                  <QuoteRemoveButton onDelete={() => deleteQuote(q.id)} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function QuoteRemoveButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.65 : 1 }}
        >
          {busy ? "Deleting..." : "Delete quote"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "1px solid var(--border, #E2E8F0)", background: "#fff", color: "var(--ink, #0B1220)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setConfirming(true);
      }}
      style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "1px solid #FCA5A5", background: "#FEE2E2", color: "#991B1B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
    >
      Remove
    </button>
  );
}
