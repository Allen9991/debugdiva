import { NextResponse } from "next/server";
import { demoStore, type DemoInvoice } from "@/lib/demo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const invoice = demoStore.invoices.get(id) ?? demoStore.invoices.forJob(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice: invoiceResponse(invoice) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = body.status;

  if (status !== "draft" && status !== "sent" && status !== "paid") {
    return NextResponse.json(
      { error: "status must be draft, sent, or paid" },
      { status: 400 },
    );
  }

  const invoice = demoStore.invoices.get(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const updated = demoStore.invoices.update(id, {
    status,
    sent_at: status === "sent" ? new Date().toISOString() : invoice.sent_at,
  });

  return NextResponse.json({ invoice: invoiceResponse(updated!) });
}
