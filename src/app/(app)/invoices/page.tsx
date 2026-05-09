import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Invoice, Job } from "@/lib/types";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

type InvoiceRow = Invoice & {
  jobs: Pick<Job, "id" | "location"> & {
    client: Pick<Client, "name" | "email" | "phone"> | null;
  };
};

function invoiceStatus(invoice: Invoice) {
  if (
    invoice.status === "sent" &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date(new Date().toISOString().slice(0, 10))
  ) {
    return "overdue";
  }

  return invoice.status;
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
};

async function getInvoices() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, jobs!inner(id, user_id, location, client:clients(name, email, phone))")
    .eq("jobs.user_id", demoUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InvoiceRow[];
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold text-cyan-700">Money to collect</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Invoices</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          Drafts, sent invoices, paid work, and overdue payments in one quick scan.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Invoice list</h2>
            <p className="mt-1 text-sm text-slate-500">Pulled from Supabase for Ghost Plumbing.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {invoices.length} total
          </span>
        </div>

        {invoices.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            No invoices yet. Completed jobs that become drafts will show up here.
          </p>
        ) : (
          <div className="grid gap-3">
            {invoices.map((invoice) => {
              const status = invoiceStatus(invoice);

              return (
                <Link
                  key={invoice.id}
                  href={`/jobs/${invoice.job_id}`}
                  className="grid gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}>
                        {status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Due {invoice.due_date ?? "not set"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold">
                      {invoice.jobs.client?.name ?? "Unknown client"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {invoice.jobs.location ?? "Location missing"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4 text-left md:min-w-48 md:text-right">
                    <p className="text-sm text-slate-500">Total inc GST</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(invoice.total)}</p>
                    <p className="mt-1 text-sm text-slate-500">GST {formatCurrency(invoice.gst)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
