import { calculateNzGst } from "@/lib/gst";
import type { LineItem, Quote } from "@/lib/types";

const LABOUR_RATE = 90; // NZD per hour
const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333334"; // James, Bealey Ave tap replacement

export async function POST(request: Request) {
  const body = await request.json();
  const job_id = body.job_id ?? DEMO_JOB_ID;

  // Fetch job + client from Jayden's jobs API
  const origin = new URL(request.url).origin;
  const jobRes = await fetch(`${origin}/api/jobs/${job_id}`);

  if (!jobRes.ok) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const { job, client } = await jobRes.json();

  const warnings: string[] = [];
  if (!client?.email) {
    warnings.push("No client email on file — quote can't be sent digitally");
  }

  // Transform Jayden's job format into our line items
  const labourTotal = (job.labour_hours ?? 0) * LABOUR_RATE;
  const materialsTotal = (job.materials as { name: string; cost: number }[]).reduce(
    (sum, m) => sum + m.cost,
    0
  );

  const lineItems: LineItem[] = [
    ...(job.labour_hours > 0
      ? [
          {
            id: crypto.randomUUID(),
            description: "Labour",
            quantity: job.labour_hours,
            unit_price: LABOUR_RATE,
            total: labourTotal,
            type: "labour" as const,
          },
        ]
      : []),
    ...(job.materials as { name: string; cost: number }[]).map((m) => ({
      id: crypto.randomUUID(),
      description: m.name,
      quantity: 1,
      unit_price: m.cost,
      total: m.cost,
      type: "material" as const,
    })),
  ];

  const subtotal = labourTotal + materialsTotal;
  const gst = calculateNzGst(subtotal);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const quote: Quote = {
    id: crypto.randomUUID(),
    job_id: job.id,
    quote_number: `QUO-${Date.now().toString().slice(-6)}`,
    client_name: client?.name ?? "Unknown client",
    client_email: client?.email,
    job_description: job.description,
    line_items: lineItems,
    subtotal,
    gst,
    total: subtotal + gst,
    gst_enabled: true,
    status: "draft",
    expires_at: expiresAt.toISOString().split("T")[0],
    created_at: new Date().toISOString(),
  };

  return Response.json({ quote, warnings });
}
