"use client";

import { useState } from "react";
import { GhostlyFrame } from "@/components/shell/GhostlyFrame";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";
import type { Quote } from "@/lib/types";
import { QuoteDraftView } from "@/components/output/QuoteDraftView";

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
      if (!res.ok) {
        throw new Error(data.error || "Failed to create quote");
      }
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
    if (!res.ok) {
      throw new Error("Failed to send");
    }
  };

  if (quote) {
    return (
      <QuoteDraftView
        quote={quote}
        warnings={warnings}
        onApproveAndSend={handleSend}
      />
    );
  }

  return (
    <GhostlyFrame
      eyebrow="Quotes"
      title="Professional pricing before the job starts."
      description="Ghostly should help a tradie get from rough scope to client-ready quote without losing their tone or inventing details they never gave."
      aside={<QuotesAside />}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <Card padding={20}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            <QuoteMetric label="Template style" value="Casual, clear" helper="Friendly enough for tradies, professional enough for clients" />
            <QuoteMetric label="Expiry" value="Editable" helper="Demo flow can set expiry right before send" />
            <QuoteMetric label="Linked records" value="Job-based" helper="Quote stays attached to the client and future invoice" />
          </div>
        </Card>

        <Card padding={24}>
          <Eyebrow>Demo quote</Eyebrow>
          <h2 style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.7 }}>
            Bealey Ave tap replacement
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)", maxWidth: 540 }}>
            Generate a quote draft for James Wilson, then adjust line items and hold to send. This keeps the tab aligned with the same edit-first flow as invoices.
          </p>

          {error ? (
            <div
              style={{
                marginTop: 16,
                borderRadius: 16,
                background: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FECACA",
                padding: 14,
                fontSize: 13.5,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={createDemoQuote}
            disabled={loading}
            style={{
              marginTop: 18,
              height: 56,
              padding: "0 20px",
              borderRadius: 16,
              border: "none",
              background: "var(--ink)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {loading ? "Building quote..." : "Create quote draft"}
          </button>
        </Card>
      </div>
    </GhostlyFrame>
  );
}

function QuoteMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={{ borderRadius: 16, border: "1px solid var(--border)", background: "#fff", padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: -0.6 }}>
        {value}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function QuotesAside() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card padding={18}>
        <Eyebrow>Quote philosophy</Eyebrow>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          The product promise here is confidence. Ghostly should make the first draft feel thoughtful, but still editable before it reaches a customer.
        </p>
      </Card>

      <Card padding={18}>
        <Eyebrow>Suggested states</Eyebrow>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Pill tone="amber">Draft</Pill>
          <Pill tone="accent">Sent</Pill>
          <Pill tone="emerald">Accepted</Pill>
        </div>
      </Card>
    </div>
  );
}
