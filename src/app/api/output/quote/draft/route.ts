import { demoStore } from "@/lib/demo-store";
import type { LineItem, Quote } from "@/lib/types";

const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333334";

export async function POST(request: Request) {
  console.log("[POST /api/output/quote/draft] called");
  const body = await request.json().catch(() => ({}));
  const job_id: string = body.job_id ?? DEMO_JOB_ID;
  console.log("[POST /api/output/quote/draft] called with: job_id=", job_id);

  const job = demoStore.jobs.get(job_id);
  if (!job) {
    const errResp = { error: "Job not found" };
    console.log("[POST /api/output/quote/draft] returning:", errResp);
    return Response.json(errResp, { status: 404 });
  }

  const settings = demoStore.settings.get();
  const labourTotal = job.labour_hours * settings.labour_rate;
  const materialsTotal = job.materials.reduce((s, m) => s + m.cost, 0);
  const subtotal = labourTotal + materialsTotal;
  const gst = settings.gst_enabled
    ? Math.round(subtotal * 0.15 * 100) / 100
    : 0;
  const total = Math.round((subtotal + gst) * 100) / 100;

  const lineItems: LineItem[] = [
    ...(job.labour_hours > 0
      ? [
          {
            id: crypto.randomUUID(),
            description: "Labour",
            quantity: job.labour_hours,
            unit_price: settings.labour_rate,
            total: labourTotal,
            type: "labour" as const,
          },
        ]
      : []),
    ...job.materials.map((m) => ({
      id: crypto.randomUUID(),
      description: m.name,
      quantity: 1,
      unit_price: m.cost,
      total: m.cost,
      type: "material" as const,
    })),
  ];

  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const quote: Quote = {
    id: crypto.randomUUID(),
    job_id: job.id,
    quote_number: "QUO-" + job.id.slice(0, 6).toUpperCase(),
    client_name: job.client_name,
    client_email: job.client_email,
    job_description: job.description,
    line_items: lineItems,
    subtotal,
    gst,
    total,
    gst_enabled: gst > 0,
    status: "draft",
    expires_at,
    created_at: new Date().toISOString(),
  };

  const warnings: string[] = [];
  if (!job.client_email) {
    warnings.push("No client email on file - quote can't be sent digitally");
  }

  const response = { quote, warnings };
  console.log("[POST /api/output/quote/draft] returning quote id:", quote.id);
  return Response.json(response);
}
