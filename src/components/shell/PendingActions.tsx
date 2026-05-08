import Link from "next/link";

import type { PendingAction } from "@/lib/types";

type PendingActionsProps = {
  actions: PendingAction[];
};

const actionLabels: Record<PendingAction["type"], string> = {
  send_invoice: "Invoice",
  follow_up_quote: "Quote",
  attach_receipt: "Receipt",
  missing_info: "Missing info",
};

const priorityStyles: Record<PendingAction["priority"], string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function PendingActions({ actions }: PendingActionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Pending actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Smart reminders from jobs, invoices, quotes, and captures.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {actions.length} open
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {actions.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            Nothing needs chasing right now.
          </p>
        ) : (
          actions.map((action, index) => {
            const content = (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {actionLabels[action.type]}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[action.priority]}`}
                    >
                      {action.priority}
                    </span>
                  </div>
                  <p className="mt-3 font-medium text-slate-900">{action.label}</p>
                </div>

                <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
                  Review
                </span>
              </div>
            );

            return action.job_id ? (
              <Link key={`${action.label}-${index}`} href={`/jobs/${action.job_id}`}>
                {content}
              </Link>
            ) : (
              <div key={`${action.label}-${index}`}>{content}</div>
            );
          })
        )}
      </div>
    </section>
  );
}
