import type { Capture, Invoice, Job, PendingAction, Quote } from "@/lib/types";

type ReminderInput = {
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  captures: Capture[];
};

const ageInDays = (isoDate: string) =>
  (Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000);

const jobName = (job: Job) => job.location ?? "job with missing location";

export function buildReminderQueue({
  jobs,
  invoices,
  quotes,
  captures,
}: ReminderInput): PendingAction[] {
  const actions: PendingAction[] = [];

  for (const job of jobs) {
    const invoice = invoices.find((item) => item.job_id === job.id);
    const linkedReceipts = captures.filter(
      (capture) => capture.type === "receipt" && capture.job_id === job.id,
    );

    if (job.status === "completed" && !invoice) {
      actions.push({
        type: "send_invoice",
        label: `Create invoice for ${jobName(job)}`,
        job_id: job.id,
        priority: "high",
      });
    }

    if (invoice?.status === "draft") {
      actions.push({
        type: "send_invoice",
        label: `Send draft invoice for ${jobName(job)}`,
        job_id: job.id,
        priority: "high",
      });
    }

    if (job.materials.length > 0 && linkedReceipts.length === 0) {
      actions.push({
        type: "attach_receipt",
        label: `Add receipt for materials on ${jobName(job)}`,
        job_id: job.id,
        priority: "medium",
      });
    }

    if (!job.location || !job.client_id) {
      actions.push({
        type: "missing_info",
        label: `Fill missing job info before this can become an invoice`,
        job_id: job.id,
        priority: "medium",
      });
    }
  }

  for (const invoice of invoices) {
    const job = jobs.find((item) => item.id === invoice.job_id);

    if (invoice.status === "sent" && invoice.sent_at && ageInDays(invoice.sent_at) > 7) {
      actions.push({
        type: "send_invoice",
        label: `Follow up payment for ${job ? jobName(job) : "sent invoice"}`,
        job_id: invoice.job_id,
        priority: "high",
      });
    }
  }

  for (const quote of quotes) {
    const job = jobs.find((item) => item.id === quote.job_id);

    if (quote.status === "sent" && ageInDays(quote.created_at) > 3) {
      actions.push({
        type: "follow_up_quote",
        label: `Follow up quote for ${job ? jobName(job) : "quoted job"}`,
        job_id: quote.job_id,
        priority: "medium",
      });
    }
  }

  for (const capture of captures) {
    if (capture.type === "receipt" && !capture.job_id) {
      actions.push({
        type: "attach_receipt",
        label: "Link Bunnings receipt to the right job",
        priority: "low",
      });
    }
  }

  return actions;
}
