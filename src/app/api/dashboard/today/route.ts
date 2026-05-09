import { NextResponse } from "next/server";

type Priority = "high" | "medium" | "low";

type PendingAction = {
  type: "send_invoice" | "follow_up_quote" | "attach_receipt" | "missing_info";
  label: string;
  job_id?: string;
  priority: Priority;
};

const demoUserId = "11111111-1111-1111-1111-111111111111";

const demoJobs = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    user_id: demoUserId,
    client_name: "Sarah Thompson",
    location: "25 Queen Street, Christchurch",
    description:
      "Leak repair under kitchen sink. Used sealant, pipe fitting, and replacement valve. Job tested and complete.",
    status: "completed",
    labour_hours: 2,
    materials: [
      { name: "Sealant", cost: 15 },
      { name: "Pipe fitting", cost: 25 },
      { name: "Replacement valve", cost: 35 },
    ],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333334",
    user_id: demoUserId,
    client_name: "James Wilson",
    location: "14 Bealey Avenue, Christchurch",
    description: "Bathroom tap replacement. Quote sent, waiting for approval.",
    status: "quoted",
    labour_hours: 1.5,
    materials: [
      { name: "Mixer tap", cost: 95 },
      { name: "Flexible hose pair", cost: 28 },
    ],
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333335",
    user_id: demoUserId,
    client_name: "Emma Patel",
    location: "8 Riccarton Road, Christchurch",
    description: "Hot water cylinder inspection completed. Invoice already sent.",
    status: "invoiced",
    labour_hours: 1,
    materials: [{ name: "Inspection consumables", cost: 20 }],
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoInvoices = [
  {
    id: "55555555-5555-5555-5555-555555555555",
    job_id: "33333333-3333-3333-3333-333333333333",
    status: "draft",
    total: 293.25,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    sent_at: null,
  },
  {
    id: "55555555-5555-5555-5555-555555555556",
    job_id: "33333333-3333-3333-3333-333333333335",
    status: "sent",
    total: 126.5,
    due_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    sent_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoQuotes = [
  {
    id: "66666666-6666-6666-6666-666666666666",
    job_id: "33333333-3333-3333-3333-333333333334",
    status: "sent",
    total: 296.7,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoCaptures = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    user_id: demoUserId,
    type: "voice",
    raw_text:
      "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.",
    processed: true,
    job_id: "33333333-3333-3333-3333-333333333333",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444445",
    user_id: demoUserId,
    type: "receipt",
    raw_text: "Bunnings receipt. Plumbing materials. Total $75.00 including GST.",
    processed: true,
    job_id: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

function daysAgo(dateString: string | null) {
  if (!dateString) return 0;

  const date = new Date(dateString);
  const now = new Date();

  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function buildPendingActions(): PendingAction[] {
  const actions: PendingAction[] = [];

  for (const job of demoJobs) {
    const invoice = demoInvoices.find((item) => item.job_id === job.id);

    if (job.status === "completed" && !invoice) {
      actions.push({
        type: "send_invoice",
        label: `Create invoice for ${job.client_name}`,
        job_id: job.id,
        priority: "high",
      });
    }

    if (
      job.materials.length > 0 &&
      ["completed", "invoiced", "paid"].includes(job.status)
    ) {
      const linkedReceipt = demoCaptures.find(
        (capture) => capture.type === "receipt" && capture.job_id === job.id,
      );

      if (!linkedReceipt) {
        actions.push({
          type: "attach_receipt",
          label: `Add receipt for ${job.client_name}'s materials`,
          job_id: job.id,
          priority: "medium",
        });
      }
    }
  }

  for (const invoice of demoInvoices) {
    if (invoice.status === "draft") {
      const job = demoJobs.find((item) => item.id === invoice.job_id);

      actions.push({
        type: "send_invoice",
        label: `Send draft invoice for ${job?.client_name ?? "client"}`,
        job_id: invoice.job_id,
        priority: "high",
      });
    }

    if (invoice.status === "sent" && daysAgo(invoice.sent_at) > 7) {
      const job = demoJobs.find((item) => item.id === invoice.job_id);

      actions.push({
        type: "send_invoice",
        label: `Follow up overdue payment from ${job?.client_name ?? "client"}`,
        job_id: invoice.job_id,
        priority: "high",
      });
    }
  }

  for (const quote of demoQuotes) {
    if (quote.status === "sent" && daysAgo(quote.created_at) > 3) {
      const job = demoJobs.find((item) => item.id === quote.job_id);

      actions.push({
        type: "follow_up_quote",
        label: `Follow up quote for ${job?.client_name ?? "client"}`,
        job_id: quote.job_id,
        priority: "medium",
      });
    }
  }

  for (const capture of demoCaptures) {
    if (!capture.job_id) {
      actions.push({
        type: "attach_receipt",
        label: "Link unassigned Bunnings receipt to a job",
        priority: "medium",
      });
    }
  }

  return actions;
}

export async function GET() {
  const pendingActions = buildPendingActions();

  return NextResponse.json({
    pending_actions: pendingActions,
    stats: {
      jobs_today: 1,
      unpaid_invoices: demoInvoices.filter((invoice) => invoice.status === "sent")
        .length,
      quotes_pending: demoQuotes.filter((quote) => quote.status === "sent").length,
      receipts_unlinked: demoCaptures.filter(
        (capture) => capture.type === "receipt" && !capture.job_id,
      ).length,
    },
  });
}
