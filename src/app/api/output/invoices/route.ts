import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

// Backwards-compatible: the assistant page still hits this endpoint. Now it
// just delegates to the shared demo store so it sees newly-created invoices
// instead of hardcoded demo rows.

type InvoiceSummary = {
  id: string;
  job_id: string;
  client_name: string;
  location: string;
  description: string;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string;
  created_at: string;
};

export async function GET() {
  console.log("[GET /api/output/invoices] called");
  const invoices: InvoiceSummary[] = demoStore.invoices.all().map((inv) => ({
    id: inv.id,
    job_id: inv.job_id,
    client_name: inv.client_name,
    location: inv.location,
    description: inv.description,
    total: inv.total,
    status: inv.status,
    due_date: inv.due_date,
    created_at: inv.created_at,
  }));
  const response = { invoices };
  console.log(
    "[GET /api/output/invoices] returning:",
    invoices.length,
    "invoices",
  );
  return NextResponse.json(response);
}
