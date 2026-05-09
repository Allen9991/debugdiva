"use client";

import { useState } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/types";
import { QuoteDraftView } from "@/components/output/QuoteDraftView";
import { Eyebrow } from "@/components/ui/primitives";

const NAV = [
  { label: "Today", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Invoices", href: "/invoices" },
  { label: "Quotes", href: "/quotes", active: true },
  { label: "Assistant", href: "/assistant" },
];

export default function QuotesPage() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDemoQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/output/quote/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: "33333333-3333-3333-3333-333333333334" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quote");
      setQuote(data.quote);
      setWarnings(data.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (updated: Quote) => {
    const res = await fetch("/api/output/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: updated.id, document_type: "quote" }),
    });
    if (!res.ok) throw new Error("Failed to send");
  };

  if (quote) {
    return <QuoteDraftView quote={quote} warnings={warnings} onApproveAndSend={handleSend} />;
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        <header>
          <Eyebrow>Output zone</Eyebrow>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Quotes</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
            Send professional quotes before the job starts.
          </p>
        </header>

        <nav className="gh-mobile-only" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background: item.active ? "var(--accent)" : "var(--surface)",
                color: item.active ? "#fff" : "var(--muted)",
                border: `1px solid ${item.active ? "transparent" : "var(--border)"}`,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-card-lg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48 }}>📝</div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Create a quote</div>
          <p style={{ fontSize: 13.5, color: "var(--muted)", maxWidth: 320, lineHeight: 1.5 }}>
            Demo: James Wilson, 14 Bealey Ave tap replacement
          </p>

          {error && (
            <div
              style={{
                width: "100%",
                maxWidth: 360,
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#991B1B",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={createDemoQuote}
            disabled={loading}
            style={{
              marginTop: 4,
              height: 52,
              padding: "0 28px",
              borderRadius: 14,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "var(--shadow-accent)",
            }}
          >
            {loading ? "Creating quote..." : "Create Quote — Bealey Ave Job"}
          </button>
        </section>
      </div>
    </main>
  );
}
