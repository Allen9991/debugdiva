"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { InvoiceDraftView } from "@/components/output/InvoiceDraftView";
import type { Invoice } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

type DraftResponse = { invoice: Invoice; warnings?: string[] };

export default function InvoiceDetailPage({ params }: Props) {
  const { id: jobId } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/output/invoice/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        });
        if (!res.ok) throw new Error(`Draft failed (${res.status})`);
        const data = (await res.json()) as DraftResponse;
        if (cancelled) return;
        setInvoice(data.invoice);
        setWarnings(data.warnings ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleApproveAndSend = async (edited: Invoice) => {
    const res = await fetch("/api/output/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: edited.id,
        document_type: "invoice",
      }),
    });
    if (!res.ok) throw new Error(`Send failed (${res.status})`);
    // Surface a sent state via the InvoiceDraftView's internal `sent` flag
    // by resolving the promise; the component handles its own banner.
    return;
  };

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white border border-red-200 p-6 max-w-sm text-center">
          <p className="text-2xl">⚠️</p>
          <p className="text-sm font-semibold text-red-800 mt-2">
            Couldn&rsquo;t load this invoice
          </p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <button
            onClick={() => router.push("/invoices")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            ← Back to invoices
          </button>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading invoice draft…</div>
      </main>
    );
  }

  return (
    <InvoiceDraftView
      invoice={invoice}
      warnings={warnings}
      onApproveAndSend={handleApproveAndSend}
    />
  );
}
