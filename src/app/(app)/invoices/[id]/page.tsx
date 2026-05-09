"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Invoice = {
  id: string;
  job_id: string;
  client_name: string;
  location: string;
  description: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  subtotal: number;
  gst: number;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string;
  sent_at: string | null;
  created_at: string;
};

function money(v: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(v);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "send" | "paid" | "undo">(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      console.log("[InvoiceDetail] fetching /api/invoices/", id);
      try {
        const res = await fetch("/api/invoices/" + id, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load (" + res.status + ")");
        const data = await res.json();
        if (cancelled) return;
        console.log("[InvoiceDetail] loaded:", data.invoice?.client_name);
        setInvoice(data.invoice);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load";
        console.error("[InvoiceDetail] load failed:", msg);
        setError(msg);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function patchStatus(next: Invoice["status"], action: "send" | "paid" | "undo") {
    if (!invoice) return;
    console.log("[InvoiceDetail] status change clicked ->", next);
    setBusy(action);
    try {
      const res = await fetch("/api/invoices/" + invoice.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      console.log("[InvoiceDetail] PATCH response:", data);
      if (!res.ok || !data?.invoice) {
        throw new Error(data?.error ?? "Failed to update");
      }
      setInvoice(data.invoice as Invoice);
    } catch (err) {
      console.error("[InvoiceDetail] PATCH failed:", err);
      alert(err instanceof Error ? err.message : "Couldn't update invoice");
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", padding: 20, borderRadius: 14 }}>
          <div style={{ fontWeight: 700 }}>Couldn&rsquo;t load this invoice</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{error}</div>
          <Link href="/invoices" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
            &larr; Back to invoices
          </Link>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#64748B" }}>Loading invoice&hellip;</div>
      </main>
    );
  }

  const statusBadge =
    invoice.status === "paid"
      ? { bg: "#D1FAE5", fg: "#065F46" }
      : invoice.status === "sent"
      ? { bg: "#DBEAFE", fg: "#1E3A8A" }
      : { bg: "#FEF3C7", fg: "#92400E" };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 16px", display: "grid", gap: 18 }}>
        <Link
          href="/invoices"
          onClick={() => console.log("[InvoiceDetail] back to invoices")}
          style={{ fontSize: 13, color: "var(--muted, #64748B)", textDecoration: "none", fontWeight: 600 }}
        >
          &larr; Back to invoices
        </Link>

        <header style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--muted, #64748B)" }}>
            Invoice
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>{invoice.client_name}</h1>
          <div style={{ fontSize: 14, color: "var(--muted, #64748B)" }}>{invoice.location}</div>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink, #0B1220)", lineHeight: 1.55 }}>
            {invoice.description}
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: statusBadge.bg, color: statusBadge.fg, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
              {titleCase(invoice.status)}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted, #64748B)" }}>
              Due {new Date(invoice.due_date).toLocaleDateString("en-NZ")}
            </span>
          </div>
        </header>

        <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 22 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Line items</h2>
          <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
            {invoice.line_items.map((item, i) => (
              <div
                key={i}
                style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "10px 12px", border: "1px solid var(--border, #E2E8F0)", borderRadius: 10, fontSize: 13.5 }}
              >
                <span>
                  {item.description} <span style={{ color: "var(--muted, #64748B)" }}>x {item.quantity}</span>
                </span>
                <span style={{ fontWeight: 700 }}>{money(item.total)}</span>
              </div>
            ))}
          </div>

          <table style={{ width: "100%", marginTop: 16, fontSize: 13.5, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--muted, #64748B)" }}>Labour</td>
                <td style={{ textAlign: "right" }}>{money(invoice.labour_total)}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--muted, #64748B)" }}>Materials</td>
                <td style={{ textAlign: "right" }}>{money(invoice.materials_total)}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--muted, #64748B)" }}>GST (15%)</td>
                <td style={{ textAlign: "right" }}>{money(invoice.gst)}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 0 4px", borderTop: "2px solid var(--ink, #0B1220)", fontWeight: 800, fontSize: 16 }}>
                  Total (NZD)
                </td>
                <td style={{ padding: "10px 0 4px", borderTop: "2px solid var(--ink, #0B1220)", textAlign: "right", fontWeight: 800, fontSize: 16 }}>
                  {money(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => patchStatus("sent", "send")}
              disabled={invoice.status !== "draft" || busy !== null}
              style={{ padding: "10px 16px", borderRadius: 10, background: "var(--ink, #0B1220)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: invoice.status !== "draft" || busy ? "not-allowed" : "pointer", opacity: invoice.status !== "draft" || busy ? 0.6 : 1 }}
            >
              {busy === "send" ? "Sending..." : "Mark as Sent"}
            </button>

            <button
              type="button"
              onClick={() => patchStatus("paid", "paid")}
              disabled={invoice.status === "paid" || busy !== null}
              style={{ padding: "10px 16px", borderRadius: 10, background: "#10B981", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: invoice.status === "paid" || busy ? "not-allowed" : "pointer", opacity: invoice.status === "paid" || busy ? 0.6 : 1 }}
            >
              {busy === "paid" ? "Marking..." : "Mark as Paid"}
            </button>

            {invoice.status !== "draft" && (
              <button
                type="button"
                onClick={() => patchStatus("draft", "undo")}
                disabled={busy !== null}
                style={{ padding: "10px 16px", borderRadius: 10, background: "#fff", color: "var(--ink, #0B1220)", border: "1px solid var(--border, #E2E8F0)", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
              >
                {busy === "undo" ? "Undoing..." : "Undo to Draft"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
