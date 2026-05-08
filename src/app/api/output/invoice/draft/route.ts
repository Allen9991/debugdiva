import { calculateNzGst } from "@/lib/gst";
import type { Invoice, Job } from "@/lib/types";

const DEMO_JOB: Job = {
  id: "demo",
  title: "Leak repair at 25 Queen Street",
  client_name: "Sarah",
  client_email: "sarah@example.com",
  job_description: "Leak repair at 25 Queen Street. Job tested and complete.",
  address: "25 Queen Street",
  line_items: [
    { id: "1", description: "Labour - leak repair", quantity: 2, unit_price: 75, total: 150, type: "labour" },
    { id: "2", description: "Sealant", quantity: 1, unit_price: 15, total: 15, type: "material" },
    { id: "3", description: "Pipe fitting", quantity: 1, unit_price: 25, total: 25, type: "material" },
    { id: "4", description: "Replacement valve", quantity: 1, unit_price: 35, total: 35, type: "material" },
  ],
  labour_total: 150,
  materials_total: 75,
  status: "complete",
  created_at: new Date().toISOString(),
};

export async function POST(request: Request) {
  const { job_id } = await request.json();
  
  // Once jayden's DB schema is set up replace the next line with:
  // const supabase = createSupabaseServerClient()
  // const { data: job } = await supabase.from("jobs").select("*").eq("id", job_id).single()
  const job: Job = DEMO_JOB;
  const warnings: string[] = [];

  if (!job.client_email) {
    warnings.push("No client email on file — invoice can't be sent digitally");
  }

  const subtotal = job.labour_total + job.materials_total;
  const gst = calculateNzGst(subtotal);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 20);

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    job_id: job.id,
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    client_name: job.client_name,
    client_email: job.client_email,
    job_description: job.job_description,
    line_items: job.line_items,
    labour_total: job.labour_total,
    materials_total: job.materials_total,
    subtotal,
    gst,
    total: subtotal + gst,
    gst_enabled: true,
    due_date: dueDate.toISOString().split("T")[0],
    status: "draft",
    created_at: new Date().toISOString(),
  };

  return Response.json({ invoice, warnings });
}
