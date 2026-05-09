import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Capture, Invoice, Job, JobWithClient, PendingAction, Quote } from "@/lib/types";

type ReminderInput = {
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  captures: Capture[];
};

export type ReminderSourceData = ReminderInput;

const ageInDays = (isoDate: string) =>
  (Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000);

const demoUserId = "11111111-1111-1111-1111-111111111111";

const jobName = (job: Job) => {
  const jobWithClient = job as Partial<JobWithClient>;

  if (jobWithClient.client_name && job.location) {
    return `${jobWithClient.client_name} at ${job.location}`;
  }

  return jobWithClient.client_name ?? job.location ?? "job with missing location";
};

export async function getReminderSourceData(
  userId = demoUserId,
): Promise<ReminderSourceData> {
  const supabase = await createSupabaseServerClient();
  const [jobsResult, invoicesResult, quotesResult, capturesResult] = await Promise.all([
    supabase.from("jobs").select("*, client:clients(*)").eq("user_id", userId),
    supabase
      .from("invoices")
      .select("*, jobs!inner(id, user_id)")
      .eq("jobs.user_id", userId)
      .in("status", ["draft", "sent"]),
    supabase
      .from("quotes")
      .select("*, jobs!inner(id, user_id)")
      .eq("jobs.user_id", userId)
      .eq("status", "sent"),
    supabase.from("captures").select("*").eq("user_id", userId),
  ]);

  const firstError =
    jobsResult.error ?? invoicesResult.error ?? quotesResult.error ?? capturesResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const jobs = ((jobsResult.data ?? []) as JobWithClient[]).map((job) => ({
    ...job,
    client_name: job.client?.name ?? "Unknown client",
  }));

  return {
    jobs,
    invoices: (invoicesResult.data ?? []) as Invoice[],
    quotes: (quotesResult.data ?? []) as Quote[],
    captures: (capturesResult.data ?? []) as Capture[],
  };
}

export async function buildReminderQueueFromDatabase(
  userId = demoUserId,
): Promise<PendingAction[]> {
  return buildReminderQueue(await getReminderSourceData(userId));
}

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
        label: "Fill missing job info before this can become an invoice",
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
        label: `Follow up payment from ${job ? jobName(job) : "sent invoice"}`,
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
        label: `Follow up quote with ${job ? jobName(job) : "quoted job"}`,
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
