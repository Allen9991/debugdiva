"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📝</div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 mb-2">Quotes</h1>
        <p className="text-slate-500 mb-8">
          Send professional quotes before the job starts.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={createDemoQuote}
          disabled={loading}
          className="w-full bg-slate-950 text-white font-bold py-4 rounded-2xl text-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Creating quote..." : "Create Quote — Bealey Ave Job"}
        </button>
        <p className="text-slate-400 text-xs mt-3">
          Demo: James Wilson, 14 Bealey Ave tap replacement
        </p>
      </div>
    </div>
  );
}
