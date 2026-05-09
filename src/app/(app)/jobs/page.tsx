import { headers } from "next/headers";

type JobStatus =
  | "new"
  | "quoted"
  | "approved"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Job = {
  id: string;
  client_name: string;
  client: Client;
  location: string;
  description: string;
  status: JobStatus;
  labour_hours: number;
  materials: { name: string; cost: number }[];
  created_at: string;
  updated_at: string;
};

type JobsResponse = {
  jobs: Job[];
};

async function getJobs(): Promise<Job[]> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const response = await fetch(`${protocol}://${host}/api/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  const data: JobsResponse = await response.json();
  return data.jobs;
}

function statusStyles(status: JobStatus) {
  const styles: Record<JobStatus, string> = {
    new: "bg-slate-100 text-slate-700",
    quoted: "bg-blue-50 text-blue-700",
    approved: "bg-indigo-50 text-indigo-700",
    in_progress: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    invoiced: "bg-purple-50 text-purple-700",
    paid: "bg-green-50 text-green-700",
  };

  return styles[status];
}

function formatStatus(status: JobStatus) {
  return status.replace("_", " ");
}

function materialsTotal(materials: { name: string; cost: number }[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

export default async function JobsPage() {
  const jobs = await getJobs();

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
            <a className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Invoices
            </a>
            <a className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Quotes
            </a>
            <a className="block rounded-2xl px-4 py-3 text-slate-600 hover:bg-slate-100">
              Assistant
            </a>
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-medium text-blue-600">Job memory</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Jobs
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Every job keeps the client, location, materials, captures,
              invoices, quotes, and follow-ups in one place.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Active jobs</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Demo plumber jobs for Ghost Plumbing.
                </p>
              </div>

              <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                + New job
              </button>
            </div>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-3xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(
                            job.status,
                          )}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {job.labour_hours}h labour
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-950">
                        {job.client_name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {job.location}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {job.description}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm md:min-w-44">
                      <p className="text-slate-500">Materials</p>
                      <p className="mt-1 text-2xl font-bold">
                        ${materialsTotal(job.materials).toFixed(2)}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {job.materials.length} item
                        {job.materials.length === 1 ? "" : "s"}
                      </p>
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