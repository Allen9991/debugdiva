type AssistantJobContext = {
  id: string;
  client_name: string;
  location: string | null;
  status: string;
  updated_at: string;
};

type AssistantInvoiceContext = {
  id: string;
  job_id: string;
  client_name: string;
  location: string | null;
  status: string;
  total: number;
  due_date: string | null;
};

type ChatPanelProps = {
  conversation_id: string;
  context: {
    recent_jobs: AssistantJobContext[];
    pending_invoices: AssistantInvoiceContext[];
  };
};

export function ChatPanel({ conversation_id, context }: ChatPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">AI assistant</h2>
          <p className="mt-1 text-sm text-slate-500">
            Conversation {conversation_id} is ready with live job and invoice context.
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          Context loaded
        </span>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Try asking</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          What should I chase today? Draft Sarah a quick job-complete text. Which invoices are still unpaid?
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent jobs</h3>
          <div className="mt-3 space-y-2">
            {context.recent_jobs.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No jobs found yet.</p>
            ) : (
              context.recent_jobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-950">{job.client_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{job.location ?? "Location missing"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Pending invoices</h3>
          <div className="mt-3 space-y-2">
            {context.pending_invoices.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No pending invoices.</p>
            ) : (
              context.pending_invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-950">{invoice.client_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {invoice.status} invoice, due {invoice.due_date ?? "not set"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          aria-label="Ask Admin Ghost"
          placeholder="Ask Admin Ghost..."
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
        <button className="min-h-12 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800">
          Send
        </button>
      </div>
    </section>
  );
}
