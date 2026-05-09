import { demoStore } from "@/lib/demo-store";
import type { Invoice, LineItem } from "@/lib/types";

const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333";

export async function POST(request: Request) {
  console.log("[POST /api/output/invoice/draft] called");
  const body = await request.json().catch(() => ({}));
  const job_id: string = body.job_id ?? DEMO_JOB_ID;
  console.log("[POST /api/output/invoice/draft] called with: job_id=", job_id);

  const job = demoStore.jobs.get(job_id);
  if (!job) {
    const errResp = { error: "Job not found" };
    console.log("[POST /api/output/invoice/draft] returning:", errResp);
    return Response.json(errResp, { status: 404 });
  }

  const stored =
    demoStore.invoices.forJob(job_id) ?? demoStore.invoices.create({ job_id });

  const subtotal = stored.labour_total + stored.materials_total;
  const lineItems: LineItem[] = stored.line_items.map((li) => ({
    id: crypto.randomUUID(),
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unit_price,
    total: li.total,
    type: li.description.toLowerCase().startsWith("labour")
      ? ("labour" as const)
      : ("material" as const),
  }));

  const invoice: Invoice = {
    id: stored.id,
    job_id: stored.job_id,
    invoice_number: "INV-" + stored.id.slice(0, 6).toUpperCase(),
    client_name: job.client_name,
    client_email: job.client_email,
    job_description: job.description,
    line_items: lineItems,
    labour_total: stored.labour_total,
    materials_total: stored.materials_total,
    subtotal,
    gst: stored.gst,
    total: stored.total,
    gst_enabled: stored.gst > 0,
    due_date: stored.due_date,
    status: stored.status,
    sent_at: stored.sent_at ?? undefined,
    created_at: stored.created_at,
  };

  const warnings: string[] = [];
  if (!job.client_email) {
    warnings.push("No client email on file - invoice can't be sent digitally");
  }

  const response = { invoice, warnings };
  console.log("[POST /api/output/invoice/draft] returning invoice id:", invoice.id);
  return Response.json(response);
}
