import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Job, Quote } from "@/lib/types";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

type QuoteRow = Quote & {
  jobs: Pick<Job, "id" | "location"> & {
    client: Pick<Client, "name" | "email" | "phone"> | null;
  };
};

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  expired: "bg-amber-50 text-amber-700",
};

function quoteStatus(quote: Quote) {
  if (
    quote.status === "sent" &&
    quote.expires_at &&
    new Date(quote.expires_at) < new Date(new Date().toISOString().slice(0, 10))
  ) {
    return "expired";
  }

  return quote.status;
}

async function getQuotes() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, jobs!inner(id, user_id, location, client:clients(name, email, phone))")
    .eq("jobs.user_id", demoUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as QuoteRow[];
}

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold text-cyan-700">Work waiting on approval</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Quotes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          Keep sent quotes visible so follow-ups happen before the job goes cold.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Quote list</h2>
            <p className="mt-1 text-sm text-slate-500">Real quote records from Supabase.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {quotes.length} total
          </span>
        </div>

        {quotes.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            No quotes yet. Drafted quotes will appear here once Output Zone creates them.
          </p>
        ) : (
          <div className="grid gap-3">
            {quotes.map((quote) => {
              const status = quoteStatus(quote);

              return (
                <Link
                  key={quote.id}
                  href={`/jobs/${quote.job_id}`}
                  className="grid gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}>
                        {status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Expires {quote.expires_at ?? "not set"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold">
                      {quote.jobs.client?.name ?? "Unknown client"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {quote.jobs.location ?? "Location missing"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4 text-left md:min-w-48 md:text-right">
                    <p className="text-sm text-slate-500">Quote total</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(quote.total)}</p>
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
