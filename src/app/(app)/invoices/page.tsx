"use client";

import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { InvoiceDraftView } from "@/components/output/InvoiceDraftView";

export default function InvoicesPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDemoInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/output/invoice/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: "33333333-3333-3333-3333-333333333333" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      setInvoice(data.invoice);
      setWarnings(data.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (updated: Invoice) => {
    const res = await fetch("/api/output/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: updated.id, document_type: "invoice" }),
    });
    if (!res.ok) throw new Error("Failed to send");
  };

  if (invoice) {
    return <InvoiceDraftView invoice={invoice} warnings={warnings} onApproveAndSend={handleSend} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoices</h1>
        <p className="text-gray-500 mb-8">
          Turn your job notes into professional invoices in seconds.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={createDemoInvoice}
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Creating invoice..." : "Create Invoice — Queen St Job"}
        </button>
        <p className="text-gray-400 text-xs mt-3">
          Demo: Sarah, 25 Queen Street leak repair
        </p>
      </div>
    </div>
  );
}
