"use client";

import { useState } from "react";
import type { Invoice, LineItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { calculateNzGst } from "@/lib/gst";
import { LineItemEditor } from "./LineItemEditor";
import { Mahi } from "@/components/mahi";
import { HoldToSend } from "@/components/ui/primitives";

function InvoiceGradientHeader({
  invoiceNumber,
  mahiSize = 56,
}: {
  invoiceNumber: string;
  mahiSize?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "24px 22px",
        background: "linear-gradient(160deg, var(--accent) 0%, #C8413B 125%)",
        color: "#fff",
        boxShadow: "var(--shadow-hero)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.13)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -50,
          right: 24,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mahi size={mahiSize} mood="happy" hardhat />
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)",
                marginBottom: 2,
              }}
            >
              Admin Ghost
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -0.7,
                lineHeight: 1.05,
              }}
            >
              INVOICE
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.78)",
              marginBottom: 4,
            }}
          >
            Invoice #
          </div>
          <div
            className="tabular-nums"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 0.4,
            }}
          >
            {invoiceNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  invoice: Invoice;
  warnings?: string[];
  onApproveAndSend: (invoice: Invoice) => Promise<void>;
}

export function InvoiceDraftView({ invoice: initial, warnings = [], onApproveAndSend }: Props) {
  const [invoice, setInvoice] = useState<Invoice>(initial);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    setInvoice((prev) => ({ ...prev, [key]: value }));

  const handleLineItemChange = (items: LineItem[]) => {
    const labour = items.filter((i) => i.type === "labour").reduce((s, i) => s + i.total, 0);
    const materials = items.filter((i) => i.type === "material").reduce((s, i) => s + i.total, 0);
    const subtotal = labour + materials;
    const gst = invoice.gst_enabled ? calculateNzGst(subtotal) : 0;
    setInvoice((prev) => ({
      ...prev,
      line_items: items,
      labour_total: labour,
      materials_total: materials,
      subtotal,
      gst,
      total: subtotal + gst,
    }));
  };

  const handleGstToggle = (enabled: boolean) => {
    const gst = enabled ? calculateNzGst(invoice.subtotal) : 0;
    setInvoice((prev) => ({ ...prev, gst_enabled: enabled, gst, total: prev.subtotal + gst }));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await onApproveAndSend(invoice);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const isReadOnly = invoice.status === "sent" || invoice.status === "paid";

  if (sent || isReadOnly) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto p-4">
          {/* Sent banner */}
          <div className={`mb-4 rounded-2xl p-4 flex items-center gap-3 ${invoice.status === "paid" ? "bg-green-50 border border-green-200 text-green-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
            <span className="text-xl">✓</span>
            <div>
              <p className="font-semibold text-sm">
                {invoice.status === "paid" ? "Invoice paid" : sent ? "Invoice sent!" : "Invoice already sent"}
              </p>
              {invoice.sent_at && (
                <p className="text-xs mt-0.5 opacity-75">
                  Sent on {new Date(invoice.sent_at).toLocaleDateString("en-NZ")}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <InvoiceGradientHeader invoiceNumber={invoice.invoice_number} />

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
                  <p className="font-semibold text-slate-950">{invoice.client_name}</p>
                  {invoice.client_email && <p className="text-slate-500 mt-0.5">{invoice.client_email}</p>}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Details</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium">{new Date(invoice.created_at).toLocaleDateString("en-NZ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Due</span>
                      <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString("en-NZ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description</div>
                <p className="text-sm text-slate-700">{invoice.job_description}</p>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Line Items</div>
                <div className="space-y-2">
                  {invoice.line_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm rounded-2xl border border-slate-100 px-4 py-3">
                      <span className="text-slate-700">{item.description} × {item.quantity}</span>
                      <span className="font-medium text-slate-950">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="space-y-2 text-sm ml-auto max-w-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Labour</span><span>{formatCurrency(invoice.labour_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Materials</span><span>{formatCurrency(invoice.materials_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-100">
                    <span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>GST (15%)</span><span>{formatCurrency(invoice.gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 text-base pt-2 border-t-2 border-slate-950">
                    <span>Total (NZD)</span><span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <a href="/invoices" className="text-sm text-blue-600 hover:text-blue-700">← Back to invoices</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4 pb-32">
        {warnings.length > 0 && (
          <div className="mb-4 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-700 text-sm">
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <InvoiceGradientHeader invoiceNumber={invoice.invoice_number} />

          <div className="p-6 space-y-6">
            {/* Bill To + Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
                <input
                  className="font-semibold text-slate-950 w-full bg-slate-50 rounded-2xl px-3 py-2 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition text-sm"
                  value={invoice.client_name}
                  onChange={(e) => set("client_name", e.target.value)}
                  placeholder="Client name"
                />
                <input
                  className="mt-1 text-slate-500 w-full bg-slate-50 rounded-2xl px-3 py-2 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition text-sm"
                  value={invoice.client_email ?? ""}
                  onChange={(e) => set("client_email", e.target.value)}
                  placeholder="Email address"
                  type="email"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Details</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium text-slate-950">
                      {new Date(invoice.created_at).toLocaleDateString("en-NZ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Due</span>
                    <input
                      type="date"
                      className="font-medium bg-slate-50 rounded-xl px-2 py-0.5 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none text-sm"
                      value={invoice.due_date}
                      onChange={(e) => set("due_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job description */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Job Description
              </div>
              <textarea
                className="w-full bg-slate-50 rounded-2xl px-3 py-2 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition text-sm text-slate-700 resize-none"
                rows={2}
                value={invoice.job_description}
                onChange={(e) => set("job_description", e.target.value)}
              />
            </div>

            {/* Line items */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Line Items
              </div>
              <LineItemEditor items={invoice.line_items} onChange={handleLineItemChange} />
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 pt-4">
              <div className="space-y-2 text-sm ml-auto max-w-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Labour</span>
                  <span>{formatCurrency(invoice.labour_total)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Materials</span>
                  <span>{formatCurrency(invoice.materials_total)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-100">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invoice.gst_enabled}
                      onChange={(e) => handleGstToggle(e.target.checked)}
                      className="rounded"
                    />
                    <span>GST (15%)</span>
                  </label>
                  <span>{formatCurrency(invoice.gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-950 text-base pt-2 border-t-2 border-slate-950">
                  <span>Total (NZD)</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom send bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
          <div className="max-w-2xl mx-auto">
            <HoldToSend
              label={sending ? "Sending…" : "Hold to approve & send"}
              accent="var(--accent)"
              disabled={sending}
              onComplete={() => {
                void handleSend();
              }}
            />
            <p className="mt-2 text-center text-xs text-slate-500">
              Hold for a second so a tap doesn&rsquo;t send by mistake.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
