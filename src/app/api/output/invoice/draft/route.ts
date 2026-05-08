import { calculateNzGst } from "@/lib/gst";
import type { Invoice, LineItem } from "@/lib/types";

const LABOUR_RATE = 90; // NZD per hour
const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333"; // Sarah, 25 Queen Street

// Known sent invoices — once Supabase is connected this comes from the DB
const SENT_JOB_IDS: Record<string, { sent_at: string; due_date: string }> = {
  "33333333-3333-3333-3333-333333333335": {
    sent_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  },
};

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
    warnings.push("No client email on file — invoice can't be sent digitally");
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

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 20);

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    job_id: job.id,
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    client_name: client?.name ?? "Unknown client",
    client_email: client?.email,
    job_description: job.description,
    line_items: lineItems,
    labour_total: labourTotal,
    materials_total: materialsTotal,
    subtotal,
    gst,
    total: subtotal + gst,
    gst_enabled: true,
    due_date: SENT_JOB_IDS[job_id]?.due_date ?? dueDate.toISOString().split("T")[0],
    status: SENT_JOB_IDS[job_id] ? "sent" : "draft",
    sent_at: SENT_JOB_IDS[job_id]?.sent_at,
    created_at: new Date().toISOString(),
  };

  return Response.json({ invoice, warnings });
}
