"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Material = { name: string; cost: number };

type Client = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Job = {
  id: string;
  client_id?: string | null;
  client_name?: string;
  location: string;
  description: string;
  status: string;
  labour_hours: number;
  materials: Material[];
  created_at: string;
  updated_at: string;
};

type Invoice = {
  id: string;
  job_id: string;
  total: number;
  labour_total: number;
  materials_total: number;
  gst: number;
  status: string;
  due_date: string;
};

type JobDetailResponse = {
  job: Job;
  client: Client | null;
  invoice: Invoice | null;
  quote: unknown | null;
  captures: unknown[];
  messages: unknown[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

function statusButtonStyle(active: boolean) {
  return {
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 10,
    border: active ? "1px solid #10B981" : "1px solid var(--border, #E2E8F0)",
    background: active ? "#D1FAE5" : "#fff",
    color: active ? "#065F46" : "var(--ink, #0B1220)",
    cursor: active ? "not-allowed" : "pointer",
    opacity: active ? 0.65 : 1,
  };
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      console.log("[JobDetailPage] fetching /api/jobs/", id);
      try {
        const res = await fetch("/api/jobs/" + id, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load job (" + res.status + ")");
        const json = (await res.json()) as JobDetailResponse;
        if (cancelled) return;
        console.log("[JobDetailPage] loaded job:", json.job?.client_name);
        setData(json);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load job";
        console.error("[JobDetailPage] load failed:", msg);
        setError(msg);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changeStatus(next: Job["status"]) {
    console.log("[JobDetailPage] status change clicked ->", next);
    try {
      const res = await fetch("/api/jobs/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      console.log("[JobDetailPage] PATCH response:", json);
      if (!res.ok || !json?.job) {
        throw new Error(json?.error ?? "Failed to update job");
      }
      setData((prev) => (prev ? { ...prev, job: { ...prev.job, status: next } } : prev));
    } catch (err) {
      console.error("[JobDetailPage] status update failed:", err);
      alert(err instanceof Error ? err.message : "Failed to update job");
    }
  }

  async function draftInvoice() {
    console.log("[JobDetailPage] Draft invoice clicked for job:", id);
    startTransition(async () => {
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: id }),
        });
        const json = await res.json();
        console.log("[JobDetailPage] /api/invoices response:", json);
        if (!res.ok || !json?.invoice?.id) {
          throw new Error(json?.error ?? "Failed to draft invoice");
        }
        router.push("/invoices/" + json.invoice.id);
      } catch (err) {
        console.error("[JobDetailPage] draftInvoice threw:", err);
        alert(err instanceof Error ? err.message : "Couldn't draft invoice");
      }
    });
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", padding: 20, borderRadius: 14, maxWidth: 420 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Couldn&rsquo;t load this job</div>
          <div style={{ fontSize: 13 }}>{error}</div>
          <Link href="/jobs" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
            &larr; Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#64748B" }}>Loading job&hellip;</div>
      </main>
    );
  }

  const { job, client, invoice } = data;
  const materialsTotal = job.materials.reduce((s, m) => s + m.cost, 0);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px", display: "grid", gap: 20 }}>
        <Link
          href="/jobs"
          onClick={() => console.log("[JobDetailPage] back to jobs")}
          style={{ fontSize: 13, color: "var(--muted, #64748B)", textDecoration: "none", fontWeight: 600 }}
        >
          &larr; Back to jobs
        </Link>

        <header style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--muted, #64748B)" }}>
            Job detail
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>
            {client?.name ?? job.client_name ?? "Unknown client"}
          </h1>
          <div style={{ fontSize: 14, color: "var(--muted, #64748B)" }}>{job.location}</div>
          <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink, #0B1220)" }}>{job.description}</p>

          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: "#EDE9FE", color: "#5B21B6", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
              {job.status.replace("_", " ")}
            </span>

            <button
              type="button"
              onClick={() => changeStatus("in_progress")}
              disabled={job.status === "in_progress"}
              style={statusButtonStyle(job.status === "in_progress")}
            >
              Mark In Progress
            </button>
            <button
              type="button"
              onClick={() => changeStatus("completed")}
              disabled={job.status === "completed"}
              style={statusButtonStyle(job.status === "completed")}
            >
              Mark Completed
            </button>
            <button
              type="button"
              onClick={() => changeStatus("paid")}
              disabled={job.status === "paid"}
              style={statusButtonStyle(job.status === "paid")}
            >
              Mark Paid
            </button>
          </div>
        </header>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1.4fr 1fr" }}>
          <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Job summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
              <SummaryTile label="Labour" value={job.labour_hours + "h"} />
              <SummaryTile label="Materials" value={money(materialsTotal)} />
              <SummaryTile label="Status" value={job.status.replace("_", " ")} />
            </div>

            <h3 style={{ margin: "22px 0 8px", fontSize: 14, fontWeight: 700 }}>Materials used</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {job.materials.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #64748B)" }}>No materials logged.</p>
              )}
              {job.materials.map((m) => (
                <div key={m.name} style={{ display: "flex", justifyContent: "space-between", border: "1px solid var(--border, #E2E8F0)", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}>
                  <span>{m.name}</span>
                  <span style={{ fontWeight: 700 }}>{money(m.cost)}</span>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ display: "grid", gap: 20 }}>
            <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Client</h2>
              <div style={{ display: "grid", gap: 6, marginTop: 12, fontSize: 13 }}>
                <div><strong>Name:</strong> {client?.name ?? "Unknown"}</div>
                <div><strong>Phone:</strong> {client?.phone ?? "Not added"}</div>
                <div><strong>Email:</strong> {client?.email ?? "Not added"}</div>
                <div><strong>Address:</strong> {client?.address ?? job.location}</div>
              </div>
            </section>

            <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Invoice</h2>
              {invoice ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{money(invoice.total)}</div>
                  <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 4, textTransform: "capitalize" }}>
                    {invoice.status} &middot; GST {money(invoice.gst)} &middot; due {invoice.due_date}
                  </div>
                  <Link
                    href={"/invoices/" + invoice.id}
                    onClick={() => console.log("[JobDetailPage] open invoice clicked")}
                    style={{ marginTop: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: 38, borderRadius: 10, background: "var(--ink, #0B1220)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                  >
                    Open invoice
                  </Link>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #64748B)" }}>No invoice for this job yet.</p>
                  <button
                    type="button"
                    onClick={draftInvoice}
                    disabled={pending}
                    style={{ marginTop: 12, width: "100%", height: 38, borderRadius: 10, background: "var(--accent, #FF5E4D)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1 }}
                  >
                    {pending ? "Drafting..." : "Draft invoice"}
                  </button>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg, #F8FAFC)", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, color: "var(--muted, #64748B)" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 20, fontWeight: 800, textTransform: "capitalize" }}>{value}</div>
    </div>
  );
}
