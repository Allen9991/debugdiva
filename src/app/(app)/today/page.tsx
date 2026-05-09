import { headers } from "next/headers";
import { GhostSummary } from "@/components/brain/GhostSummary";
import { CaptureHub } from "@/components/capture/CaptureHub";

type Priority = "high" | "medium" | "low";

type PendingAction = {
  type: "send_invoice" | "follow_up_quote" | "attach_receipt" | "missing_info";
  label: string;
  job_id?: string;
  priority: Priority;
};

type DashboardData = {
  pending_actions: PendingAction[];
  stats: {
    jobs_today: number;
    unpaid_invoices: number;
    quotes_pending: number;
    receipts_unlinked: number;
  };
};

async function getDashboardData(): Promise<DashboardData> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const response = await fetch(`${baseUrl}/api/dashboard/today`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return response.json();
}

function priorityStyles(priority: Priority) {
  if (priority === "high") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (priority === "medium") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function actionLabel(type: PendingAction["type"]) {
  if (type === "send_invoice") return "Invoice";
  if (type === "follow_up_quote") return "Quote";
  if (type === "attach_receipt") return "Receipt";
  return "Missing info";
}

function actionHref(action: PendingAction) {
  if (action.type === "send_invoice" && action.job_id) {
    return `/invoices/${action.job_id}`;
  }

  if (action.type === "follow_up_quote") {
    return "/quotes";
  }

  if (action.type === "attach_receipt") {
    return action.job_id ? `/jobs/${action.job_id}#captures` : "/capture";
  }

  return action.job_id ? `/jobs/${action.job_id}` : "/assistant";
}

export default async function TodayPage() {
  const dashboard = await getDashboardData();

  const stats = [
    {
      label: "Jobs today",
      value: dashboard.stats.jobs_today,
      helper: "Work captured today",
    },
    {
      label: "Unpaid invoices",
      value: dashboard.stats.unpaid_invoices,
      helper: "Needs payment follow-up",
    },
    {
      label: "Quotes pending",
      value: dashboard.stats.quotes_pending,
      helper: "Waiting on client replies",
    },
    {
      label: "Receipts unlinked",
      value: dashboard.stats.receipts_unlinked,
      helper: "Needs attaching to jobs",
    },
  ];

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
              href="/today"
              className="block rounded-2xl bg-slate-950 px-4 py-3 text-white"
            >
              Today
            </a>
            <a
              href="/capture"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Capture
            </a>
            <a
              href="/jobs"
              className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100"
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

          <div className="mt-8 rounded-2xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">Demo business</p>
            <p className="mt-1 text-sm text-blue-700">Ghost Plumbing</p>
            <p className="mt-3 text-xs leading-5 text-blue-700">
              Built for a NZ plumber who wants to speak job notes in the van and
              get admin ready before getting home.
            </p>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <GhostSummary />

          <header className="rounded-3xl bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white shadow-sm md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-200">
                  Today's admin brief
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  Morning, Mike. Your admin is under control.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Admin Ghost found {dashboard.pending_actions.length} things
                  needing attention. Start with Sarah's draft invoice, then
                  follow up Emma's overdue payment.
                </p>
              </div>

              <a
                href="/capture"
                className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-blue-50"
              >
                + Speak job note
              </a>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
              </article>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Quick capture</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Speak the job note while it is fresh, then let Brain Zone
                  extract the admin details.
                </p>
              </div>
            </div>
            <CaptureHub />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pending actions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Smart reminders from jobs, invoices, quotes, and captures.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {dashboard.pending_actions.length} open
                </span>
              </div>

              <div className="space-y-3">
                {dashboard.pending_actions.map((action, index) => (
                  <div
                    key={`${action.label}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {actionLabel(action.type)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles(
                            action.priority,
                          )}`}
                        >
                          {action.priority}
                        </span>
                      </div>
                      <p className="mt-3 font-medium text-slate-900">
                        {action.label}
                      </p>
                    </div>

                    <a
                      href={actionHref(action)}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Review
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">AI suggestion</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Sarah's leak repair job is complete and already has a draft
                  invoice. Send that first because it directly turns completed
                  work into cash.
                </p>
                <a
                  href="/jobs/33333333-3333-3333-3333-333333333333"
                  className="mt-5 block w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Open Sarah's job
                </a>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold">Mental load</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Admin load is high, but focused. You only need to handle the
                  top payment and invoice actions today.
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-amber-400" />
                </div>

                <p className="mt-2 text-sm font-medium text-amber-700">
                  High, but manageable
                </p>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
