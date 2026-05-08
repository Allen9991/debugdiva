import { NextResponse } from "next/server";

import { demoCaptures, demoInvoices, demoJobs, demoQuotes } from "@/lib/demo-data";
import { buildReminderQueue } from "@/lib/reminders/engine";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const pendingActions = buildReminderQueue({
    jobs: demoJobs,
    invoices: demoInvoices,
    quotes: demoQuotes,
    captures: demoCaptures,
  });

  return NextResponse.json({
    pending_actions: pendingActions,
    stats: {
      jobs_today: demoJobs.filter((job) => job.created_at.slice(0, 10) === today).length,
      unpaid_invoices: demoInvoices.filter((invoice) => invoice.status === "sent").length,
      quotes_pending: demoQuotes.filter((quote) => quote.status === "sent").length,
      receipts_unlinked: demoCaptures.filter(
        (capture) => capture.type === "receipt" && !capture.job_id,
      ).length,
    },
  });
}
