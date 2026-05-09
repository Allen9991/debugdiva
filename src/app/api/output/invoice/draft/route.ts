import { calculateNzGst } from "@/lib/gst";
import type { Invoice, LineItem } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LABOUR_RATE = 90; // NZD per hour
const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333"; // Sarah, 25 Queen Street

// The DB `invoices` table is narrower than the display-shape Invoice type:
// it has no invoice_number / client_name / client_email / job_description /
// subtotal / gst_enabled. Those are computed locally and returned to the
// client for display only.
type InvoiceInsert = {
  job_id: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  gst: number;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string | null;
  sent_at: string | null;
};

type InvoiceRow = InvoiceInsert & {
  id: string;
  created_at: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const job_id = body.job_id ?? DEMO_JOB_ID;

  // Fetch job + client from Jayden's jobs API for display fields.
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

  const supabase = await createSupabaseServerClient();

  // Find-or-create. If an invoice already exists for this job, return it
  // (so repeat visits don't insert duplicates and the send flow reuses the
  // same row). Otherwise insert a fresh draft.
  let row: InvoiceRow | null = null;
  {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("job_id", job_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<InvoiceRow>();
    if (error) {
      console.error("[invoice/draft] supabase select error:", error);
    }
    row = data;
  }

  if (!row) {
    const labourTotal = (job.labour_hours ?? 0) * LABOUR_RATE;
    const materialsTotal = (
      job.materials as { name: string; cost: number }[]
    ).reduce((sum, m) => sum + m.cost, 0);

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

    const insertPayload: InvoiceInsert = {
      job_id: job.id,
      line_items: lineItems,
      labour_total: labourTotal,
      materials_total: materialsTotal,
      gst,
      total: subtotal + gst,
      status: "draft",
      due_date: dueDate.toISOString().split("T")[0],
      sent_at: null,
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert(insertPayload)
      .select()
      .single<InvoiceRow>();

    if (error || !data) {
      console.error("[invoice/draft] supabase insert error:", error);
      return Response.json(
        {
          error: "Failed to save invoice draft",
          detail: error?.message ?? "no row returned",
        },
        { status: 500 },
      );
    }
    row = data;
  }

  // Build the display-shape Invoice the client expects, using the DB-issued
  // id and persisted totals. Display-only fields are computed from the job
  // and client and are not persisted.
  const subtotal = row.labour_total + row.materials_total;
  const invoice: Invoice = {
    id: row.id,
    job_id: row.job_id,
    invoice_number: `INV-${row.id.slice(0, 6).toUpperCase()}`,
    client_name: client?.name ?? "Unknown client",
    client_email: client?.email,
    job_description: job.description,
    line_items: row.line_items,
    labour_total: row.labour_total,
    materials_total: row.materials_total,
    subtotal,
    gst: row.gst,
    total: row.total,
    gst_enabled: row.gst > 0,
    due_date: row.due_date ?? "",
    status: row.status,
    sent_at: row.sent_at ?? undefined,
    created_at: row.created_at,
  };

  return Response.json({ invoice, warnings });
}
