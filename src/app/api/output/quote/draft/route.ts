import { calculateNzGst } from "@/lib/gst";
import type { LineItem, Quote } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LABOUR_RATE = 90; // NZD per hour
const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333334"; // James, Bealey Ave tap replacement

// DB `quotes` only stores: id, job_id, line_items, total, status, expires_at,
// created_at. quote_number / client_name / client_email / job_description /
// subtotal / gst / gst_enabled are display-only.
type QuoteInsert = {
  job_id: string;
  line_items: LineItem[];
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  expires_at: string | null;
};

type QuoteRow = QuoteInsert & {
  id: string;
  created_at: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const job_id = body.job_id ?? DEMO_JOB_ID;

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

  const supabase = await createSupabaseServerClient();

  // Find-or-create.
  let row: QuoteRow | null = null;
  {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("job_id", job_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<QuoteRow>();
    if (error) {
      console.error("[quote/draft] supabase select error:", error);
    }
    row = data;
  }

  let labourTotal: number;
  let materialsTotal: number;
  let lineItems: LineItem[];

  if (!row) {
    labourTotal = (job.labour_hours ?? 0) * LABOUR_RATE;
    materialsTotal = (
      job.materials as { name: string; cost: number }[]
    ).reduce((sum, m) => sum + m.cost, 0);

    lineItems = [
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
    const total = subtotal + gst;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const insertPayload: QuoteInsert = {
      job_id: job.id,
      line_items: lineItems,
      total,
      status: "draft",
      expires_at: expiresAt.toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("quotes")
      .insert(insertPayload)
      .select()
      .single<QuoteRow>();

    if (error || !data) {
      console.error("[quote/draft] supabase insert error:", error);
      return Response.json(
        {
          error: "Failed to save quote draft",
          detail: error?.message ?? "no row returned",
        },
        { status: 500 },
      );
    }
    row = data;
  } else {
    // Recompute display-only totals from the persisted line_items.
    lineItems = row.line_items;
    labourTotal = lineItems
      .filter((l) => l.type === "labour")
      .reduce((s, l) => s + l.total, 0);
    materialsTotal = lineItems
      .filter((l) => l.type === "material")
      .reduce((s, l) => s + l.total, 0);
  }

  const subtotal = labourTotal + materialsTotal;
  const gst = row.total - subtotal;

  const quote: Quote = {
    id: row.id,
    job_id: row.job_id,
    quote_number: `QUO-${row.id.slice(0, 6).toUpperCase()}`,
    client_name: client?.name ?? "Unknown client",
    client_email: client?.email,
    job_description: job.description,
    line_items: row.line_items,
    subtotal,
    gst,
    total: row.total,
    gst_enabled: gst > 0,
    status: row.status,
    expires_at: row.expires_at ?? "",
    created_at: row.created_at,
  };

  return Response.json({ quote, warnings });
}
