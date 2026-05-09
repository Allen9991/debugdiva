import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

type Priority = "high" | "medium" | "low";

type PendingAction = {
  type: "send_invoice" | "follow_up_quote" | "attach_receipt" | "missing_info";
  label: string;
  job_id?: string;
  priority: Priority;
};

function buildPendingActions(): PendingAction[] {
  const actions: PendingAction[] = [];
  const jobs = demoStore.jobs.all();
  const invoices = demoStore.invoices.all();
  const quotes = demoStore.quotes.all();

  for (const job of jobs) {
    const inv = demoStore.invoices.forJob(job.id);
    if (job.status === "completed" && !inv) {
      actions.push({
        type: "send_invoice",
        label: "Create invoice for " + job.client_name,
        job_id: job.id,
        priority: "high",
      });
    }
  }

  for (const inv of invoices) {
    if (inv.status === "draft") {
      actions.push({
        type: "send_invoice",
        label: "Send draft invoice for " + inv.client_name,
        job_id: inv.job_id,
        priority: "high",
      });
    }
    if (inv.status === "sent" && new Date(inv.due_date) < new Date()) {
      actions.push({
        type: "send_invoice",
        label: "Follow up overdue payment from " + inv.client_name,
        job_id: inv.job_id,
        priority: "high",
      });
    }
  }

  for (const q of quotes) {
    if (q.status === "sent") {
      actions.push({
        type: "follow_up_quote",
        label: "Follow up quote for " + q.client_name,
        job_id: q.job_id,
        priority: "medium",
      });
    }
  }

  actions.push({
    type: "attach_receipt",
    label: "Link unassigned Bunnings receipt to a job",
    priority: "medium",
  });

  return actions;
}

export async function GET() {
  console.log("[GET /api/dashboard/today] called");

  const pendingActions = buildPendingActions();
  const allInvoices = demoStore.invoices.all();
  const allQuotes = demoStore.quotes.all();
  const allJobs = demoStore.jobs.all();

  const today = new Date().toISOString().slice(0, 10);
  const jobsToday =
    allJobs.filter(
      (j) => j.created_at.startsWith(today) || j.updated_at.startsWith(today),
    ).length || allJobs.length;

  const response = {
    pending_actions: pendingActions,
    stats: {
      jobs_today: jobsToday,
      unpaid_invoices: allInvoices.filter(
        (i) => i.status === "draft" || i.status === "sent",
      ).length,
      quotes_pending: allQuotes.filter(
        (q) => q.status === "sent" || q.status === "draft",
      ).length,
      receipts_unlinked: 1,
    },
  };
  console.log(
    "[GET /api/dashboard/today] returning:",
    response.pending_actions.length,
    "pending actions, stats:",
    response.stats,
  );
  return NextResponse.json(response);
}
