import { NextResponse } from "next/server";
import { demoStore, type DemoInvoice } from "@/lib/demo-store";

function invoiceResponse(invoice: DemoInvoice) {
  const subtotal = invoice.labour_total + invoice.materials_total;
  return {
    ...invoice,
    invoice_number: "INV-" + invoice.id.slice(0, 6).toUpperCase(),
    job_description: invoice.description,
    subtotal,
    gst_enabled: invoice.gst > 0,
  };
}

export async function GET() {
  const invoices = demoStore.invoices.all().map(invoiceResponse);
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.job_id === "string" ? body.job_id : "";
  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const invoice = demoStore.invoices.create({ job_id: jobId });
  if (!invoice) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice: invoiceResponse(invoice), warnings: [] }, { status: 201 });
}
