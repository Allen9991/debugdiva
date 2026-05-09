import { ChatPanel } from "@/components/brain/ChatPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Invoice, Job } from "@/lib/types";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

type JobRow = Job & {
  client: Pick<Client, "name"> | null;
};

type InvoiceRow = Invoice & {
  jobs: Pick<Job, "id" | "location"> & {
    client: Pick<Client, "name"> | null;
  };
};

async function getAssistantContext() {
  const supabase = await createSupabaseServerClient();
  const [jobsResult, invoicesResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, client:clients(name)")
      .eq("user_id", demoUserId)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*, jobs!inner(id, user_id, location, client:clients(name))")
      .eq("jobs.user_id", demoUserId)
      .in("status", ["draft", "sent"])
      .order("created_at", { ascending: false }),
  ]);

  const firstError = jobsResult.error ?? invoicesResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const recentJobs = ((jobsResult.data ?? []) as JobRow[]).map((job) => ({
    id: job.id,
    client_name: job.client?.name ?? "Unknown client",
    location: job.location,
    status: job.status,
    updated_at: job.updated_at,
  }));

  const pendingInvoices = ((invoicesResult.data ?? []) as InvoiceRow[]).map((invoice) => ({
    id: invoice.id,
    job_id: invoice.job_id,
    client_name: invoice.jobs.client?.name ?? "Unknown client",
    location: invoice.jobs.location,
    status: invoice.status,
    total: invoice.total,
    due_date: invoice.due_date,
  }));

  return {
    recent_jobs: recentJobs,
    pending_invoices: pendingInvoices,
  };
}

export default async function AssistantPage() {
  const context = await getAssistantContext();

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold text-cyan-700">Ask about the admin pile</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Assistant</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          The assistant starts with recent jobs and pending invoices from Supabase so Allen's chat flow has useful context on load.
        </p>
      </header>

      <ChatPanel conversation_id="shell-demo-conversation" context={context} />
    </main>
  );
}
