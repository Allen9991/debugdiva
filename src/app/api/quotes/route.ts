import { NextResponse } from "next/server";
import { demoStore, type DemoQuote } from "@/lib/demo-store";
import type { Quote } from "@/lib/types";

function quoteResponse(quote: DemoQuote): Quote & {
  location: string;
  description: string;
} {
  const subtotal = quote.line_items.reduce((sum, item) => sum + item.total, 0);
  const gst = Math.round((quote.total - subtotal) * 100) / 100;

  return {
    id: quote.id,
    job_id: quote.job_id,
    quote_number: "QUO-" + quote.id.slice(0, 6).toUpperCase(),
    client_name: quote.client_name,
    client_email: quote.client_email,
    job_description: quote.description,
    line_items: quote.line_items,
    subtotal,
    gst,
    total: quote.total,
    status: quote.status,
    gst_enabled: gst > 0,
    expires_at: quote.expires_at,
    sent_at: quote.sent_at ?? undefined,
    created_at: quote.created_at,
    location: quote.location,
    description: quote.description,
  };
}

export async function GET() {
  const quotes = demoStore.quotes.all().map(quoteResponse);
  return NextResponse.json({ quotes });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.job_id === "string" ? body.job_id : "";
  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const quote = demoStore.quotes.create({ job_id: jobId });
  if (!quote) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ quote: quoteResponse(quote), warnings: [] }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const deleted = demoStore.quotes.delete(id);
  if (!deleted) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
