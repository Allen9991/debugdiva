import Link from "next/link";

import { getJobsWithClients } from "@/lib/demo-data";
import type { JobStatus, Material } from "@/lib/types";

const statusStyles: Record<JobStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  quoted: "bg-blue-50 text-blue-700",
  approved: "bg-indigo-50 text-indigo-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  invoiced: "bg-fuchsia-50 text-fuchsia-700",
  paid: "bg-green-50 text-green-700",
};

function materialsTotal(materials: Material[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

export default function JobsPage() {
  const jobs = getJobsWithClients();

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold text-cyan-700">Job memory</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Jobs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          Every job keeps the client, location, materials, captures, invoices,
          quotes, and follow-ups in one place.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Active jobs</h2>
            <p className="mt-1 text-sm text-slate-500">Demo plumber jobs for Ghost Plumbing.</p>
          </div>
          <Link
            href="/capture"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New job note
          </Link>
        </div>

        <div className="grid gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-lg border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[job.status]}`}>
                      {job.status.replace("_", " ")}
                    </span>
                    {job.labour_hours ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {job.labour_hours}h labour
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-950">{job.client_name}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {job.location ?? "Location missing"}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm md:min-w-44">
                  <p className="text-slate-500">Materials</p>
                  <p className="mt-1 text-2xl font-bold">${materialsTotal(job.materials).toFixed(2)}</p>
                  <p className="mt-1 text-slate-500">
                    {job.materials.length} item{job.materials.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
