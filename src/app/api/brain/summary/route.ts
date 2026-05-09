import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

export const runtime = "nodejs";

export async function GET() {
  console.log("[GET /api/brain/summary] called");

  const drafts = demoStore.invoices.all().filter((i) => i.status === "draft");
  const overdue = demoStore.invoices
    .all()
    .filter((i) => i.status === "sent" && new Date(i.due_date) < new Date());
  const completed = demoStore.jobs.all().filter((j) => j.status === "completed");

  const parts: string[] = [];
  if (completed[0]) {
    parts.push(
      "Solid day - " +
        completed[0].client_name +
        "'s " +
        completed[0].description.slice(0, 40).toLowerCase() +
        " is wrapped",
    );
  }
  if (drafts[0]) {
    parts.push(
      drafts.length +
        " draft invoice" +
        (drafts.length === 1 ? "" : "s") +
        " ready for " +
        drafts[0].client_name,
    );
  }
  if (overdue[0]) {
    parts.push(overdue[0].client_name + "'s payment is overdue, worth a chase");
  }
  if (parts.length === 0) parts.push("Quiet on the admin front");

  const summary = parts.join(". ") + ".";
  const response = {
    summary,
    stats: {
      jobs_completed_today: completed.length,
      draft_invoices: drafts.length,
      quotes_to_followup: 0,
      unlinked_receipts: 1,
    },
    generated_at: new Date().toISOString(),
  };
  console.log("[GET /api/brain/summary] returning fallback summary");
  return NextResponse.json(response);
}
