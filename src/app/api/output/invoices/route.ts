import { NextResponse } from "next/server";

// Demo invoice list — mirrors the dashboard's demoInvoices/demoJobs data
// so the /invoices list page renders without a DB read. The list links to
// /invoices/[job_id] which fetches a fresh draft on demand.

type InvoiceSummary = {
  job_id: string;
  client_name: string;
  location: string;
  description: string;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string;
  created_at: string;
};

const inDays = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const ago = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const demoInvoices: InvoiceSummary[] = [
  {
    job_id: "33333333-3333-3333-3333-333333333333",
    client_name: "Sarah Thompson",
    location: "25 Queen Street, Christchurch",
    description:
      "Leak repair under kitchen sink. Used sealant, pipe fitting, and replacement valve.",
    total: 293.25,
    status: "draft",
    due_date: inDays(20),
    created_at: ago(1),
  },
  {
    job_id: "33333333-3333-3333-3333-333333333335",
    client_name: "Emma Patel",
    location: "8 Riccarton Road, Christchurch",
    description: "Hot water cylinder inspection completed.",
    total: 126.5,
    status: "sent",
    due_date: inDays(-4),
    created_at: ago(11),
  },
];

export async function GET() {
  return NextResponse.json({ invoices: demoInvoices });
}
