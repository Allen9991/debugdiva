import Link from "next/link";

import { CaptureHub } from "@/components/capture/CaptureHub";
import { PendingActions } from "@/components/shell/PendingActions";
import { StatsCards } from "@/components/shell/StatsCards";
import { demoCaptures, demoInvoices, demoJobs, demoQuotes } from "@/lib/demo-data";
import { buildReminderQueue } from "@/lib/reminders/engine";

export default function TodayPage() {
  const pendingActions = buildReminderQueue({
    jobs: demoJobs,
    invoices: demoInvoices,
    quotes: demoQuotes,
    captures: demoCaptures,
  });
  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    {
      label: "Jobs today",
      value: demoJobs.filter((job) => job.created_at.slice(0, 10) === today).length,
      helper: "Work captured today",
    },
    {
      label: "Unpaid invoices",
      value: demoInvoices.filter((invoice) => invoice.status === "sent").length,
      helper: "Needs payment follow-up",
    },
    {
      label: "Quotes pending",
      value: demoQuotes.filter((quote) => quote.status === "sent").length,
      helper: "Waiting on client replies",
    },
    {
      label: "Receipts unlinked",
      value: demoCaptures.filter((capture) => capture.type === "receipt" && !capture.job_id).length,
      helper: "Needs attaching to jobs",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg bg-slate-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Today</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Morning, Mike. Your admin is lined up.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
              Start with Sarah's draft invoice, then follow up the overdue payment and
              link the Bunnings receipt before it disappears into the ute.
            </p>
          </div>

          <Link
            href="/capture"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-50"
          >
            Speak job note
          </Link>
        </div>
      </header>

      <StatsCards stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <PendingActions actions={pendingActions} />
          <CaptureHub />
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">AI suggestion</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sarah's leak repair has the invoice draft, job-complete message, labour,
              materials, and GST ready. It is the cleanest demo path to show under 2 minutes.
            </p>
            <Link
              href="/jobs/33333333-3333-3333-3333-333333333333"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Open Sarah's job
            </Link>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Assistant panel</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ask about jobs, missing receipts, unpaid invoices, or draft a casual client follow-up.
            </p>
            <Link
              href="/assistant"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
            >
              Open assistant
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
