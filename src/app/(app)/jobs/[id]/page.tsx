import { headers } from "next/headers";

type Material = {
  name: string;
  cost: number;
};

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Job = {
  id: string;
  client_id: string;
  location: string;
  description: string;
  status: string;
  labour_hours: number;
  materials: Material[];
  created_at: string;
  updated_at: string;
};

type Invoice = {
  id: string;
  job_id: string;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  labour_total: number;
  materials_total: number;
  gst: number;
  total: number;
  status: string;
  due_date: string;
  sent_at: string | null;
  created_at: string;
};

type Capture = {
  id: string;
  type: string;
  raw_text: string;
  processed: boolean;
  job_id: string | null;
  created_at: string;
};

type Message = {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
};

type JobDetailResponse = {
  job: Job;
  client: Client | null;
  invoice: Invoice | null;
  quote: unknown | null;
  captures: Capture[];
  messages: Message[];
};

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getJobDetail(id: string): Promise<JobDetailResponse> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const response = await fetch(`${protocol}://${host}/api/jobs/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load job detail");
  }

  return response.json();
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const { job, client, invoice, captures, messages } = await getJobDetail(id);

  const materialsTotal = job.materials.reduce((sum, item) => sum + item.cost, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:w-64">
          <div className="mb-8">
            <p className="text-2xl font-bold tracking-tight">Admin Ghost</p>
            <p className="mt-1 text-sm text-slate-500">
              AI admin for busy tradies
            </p>
          </div>

          <nav className="space-y-2 text-sm font-medium">
            <a
              href="/"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Today
            </a>
            <a
              href="/jobs"
              className="block rounded-2xl bg-slate-950 px-4 py-3 text-white"
            >
              Jobs
            </a>
            <a
              href="/invoices"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Invoices
            </a>
            <a
              href="/quotes"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Quotes
            </a>
            <a
              href="/assistant"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Assistant
            </a>
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <a
              href="/jobs"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to jobs
            </a>

            <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Job detail
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  {client?.name ?? "Unknown client"}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {job.location}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold capitalize text-emerald-700">
                {job.status.replace("_", " ")}
              </span>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              {job.description}
            </p>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Job summary</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Labour</p>
                    <p className="mt-1 text-2xl font-bold">
                      {job.labour_hours}h
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Materials</p>
                    <p className="mt-1 text-2xl font-bold">
                      {money(materialsTotal)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Captures</p>
                    <p className="mt-1 text-2xl font-bold">
                      {captures.length}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Materials used</h2>

                <div className="mt-5 space-y-3">
                  {job.materials.map((material) => (
                    <div
                      key={material.name}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                    >
                      <span className="font-medium">{material.name}</span>
                      <span className="font-bold">{money(material.cost)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article
                id="captures"
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
              >
                <h2 className="text-xl font-bold">Captures</h2>

                <div className="mt-5 space-y-3">
                  {captures.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No captures linked to this job yet.
                    </p>
                  ) : (
                    captures.map((capture) => (
                      <div
                        key={capture.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                            {capture.type}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            processed
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                          {capture.raw_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Client</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <p>
                    <span className="font-semibold">Name:</span>{" "}
                    {client?.name ?? "Unknown"}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {client?.phone ?? "Not added"}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {client?.email ?? "Not added"}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {client?.address ?? "Not added"}
                  </p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Invoice draft</h2>

                {invoice ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="mt-1 text-3xl font-bold">
                        {money(invoice.total)}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        Status: {invoice.status}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>Labour: {money(invoice.labour_total)}</p>
                      <p>Materials: {money(invoice.materials_total)}</p>
                      <p>GST: {money(invoice.gst)}</p>
                      <p>Due: {invoice.due_date}</p>
                    </div>

                    <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                      Approve invoice
                    </button>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No invoice created yet.
                  </p>
                )}
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Draft messages</h2>

                <div className="mt-5 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No messages drafted yet.
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <p className="font-semibold">{message.subject}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {message.body}
                        </p>
                        <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                          Review message
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
