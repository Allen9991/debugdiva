import { headers } from "next/headers";

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

async function getInvoices(): Promise<InvoiceSummary[]> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/output/invoices`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load invoices");
  const data = await res.json();
  return data.invoices;
}

function statusStyles(status: string) {
  if (status === "paid") return "bg-green-50 text-green-700";
  if (status === "sent") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:w-64">
          <div className="mb-8">
            <p className="text-2xl font-bold tracking-tight">Admin Ghost</p>
            <p className="mt-1 text-sm text-slate-500">AI admin for busy tradies</p>
          </div>

          <nav className="space-y-2 text-sm font-medium">
            <a href="/" className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Today
            </a>
            <a href="/jobs" className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Jobs
            </a>
            <a href="/invoices" className="block rounded-2xl bg-slate-950 px-4 py-3 text-white">
              Invoices
            </a>
            <a href="/quotes" className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Quotes
            </a>
            <a href="/assistant" className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Assistant
            </a>
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-medium text-blue-600">Output zone</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Invoices</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Turn completed jobs into professional invoices. Edit, approve, and send in under two minutes.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">All invoices</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on file.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <a
                  key={invoice.job_id}
                  href={`/invoices/${invoice.job_id}`}
                  className="block rounded-3xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Due {new Date(invoice.due_date).toLocaleDateString("en-NZ")}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-950">{invoice.client_name}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-600">{invoice.location}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{invoice.description}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm md:min-w-44">
                      <p className="text-slate-500">Total</p>
                      <p className="mt-1 text-2xl font-bold">{money(invoice.total)}</p>
                      <p className="mt-1 capitalize text-slate-500">{invoice.status}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
