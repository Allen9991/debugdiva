import { CaptureHub } from "@/components/capture/CaptureHub";

const reminders = [
  "Invoice still needs sending for yesterday's leak repair.",
  "Two receipts are missing from this week's materials spend.",
  "Sarah at Queen Street is due a job-complete message.",
];

export default function TodayPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf6_100%)] px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Today
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Admin starts with what you capture on site.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Record the job note while it is fresh. Snap the receipt before it gets
            lost. Let the rest of the team turn it into drafts.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Open Drafts
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">4</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Missing Receipts
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">2</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Follow Ups
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">3</p>
          </div>
        </section>

        <CaptureHub />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Pending Admin
          </p>
          <div className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {reminder}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
