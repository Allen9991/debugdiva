import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import type { Capture, Client, Invoice, Job, Material, Message, Quote } from "@/lib/types";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function materialsTotal(materials: Material[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

type JobDetailResponse = {
  job: Job;
  client: Client | null;
  invoice: Invoice | null;
  quote: Quote | null;
  captures: Capture[];
  messages: Message[];
};

async function getJobDetail(id: string): Promise<JobDetailResponse | null> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(`${protocol}://${host}/api/jobs/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load job detail");
  }

  return response.json();
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const detail = await getJobDetail(id);

  if (!detail) {
    notFound();
  }

  const { job, client, invoice, quote, captures, messages } = detail;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 md:py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <Link href="/jobs" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Back to jobs
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Job detail</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {client?.name ?? "Unknown client"}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {job.location ?? "Location missing"}
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

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Job summary</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Labour</p>
                <p className="mt-1 text-2xl font-bold">{job.labour_hours ?? 0}h</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Materials</p>
                <p className="mt-1 text-2xl font-bold">{money(materialsTotal(job.materials))}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Captures</p>
                <p className="mt-1 text-2xl font-bold">{captures.length}</p>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Materials used</h2>
            <div className="mt-4 space-y-3">
              {job.materials.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No materials added yet.</p>
              ) : (
                job.materials.map((material) => (
                  <div key={material.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <span className="font-medium">{material.name}</span>
                    <span className="font-bold">{money(material.cost)}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Captures</h2>
            <div className="mt-4 space-y-3">
              {captures.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No captures linked to this job yet.</p>
              ) : (
                captures.map((capture) => (
                  <div key={capture.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 capitalize">
                        {capture.type}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {capture.processed ? "processed" : "needs processing"}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{capture.raw_text}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <aside className="space-y-5">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Client</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold">Name:</span> {client?.name ?? "Unknown"}</p>
              <p><span className="font-semibold">Phone:</span> {client?.phone ?? "Not added"}</p>
              <p><span className="font-semibold">Email:</span> {client?.email ?? "Not added"}</p>
              <p><span className="font-semibold">Address:</span> {client?.address ?? "Not added"}</p>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Invoice draft</h2>
            {invoice ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total inc GST</p>
                  <p className="mt-1 text-3xl font-bold">{money(invoice.total)}</p>
                  <p className="mt-1 text-sm capitalize text-slate-500">Status: {invoice.status}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>Labour: {money(invoice.labour_total)}</p>
                  <p>Materials: {money(invoice.materials_total)}</p>
                  <p>GST: {money(invoice.gst)}</p>
                  <p>Due: {invoice.due_date}</p>
                </div>
                <button className="min-h-11 w-full rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800">
                  Approve invoice
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No invoice created yet.</p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Quote</h2>
            {quote ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                {money(quote.total)} quote is {quote.status}; expires {quote.expires_at}.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No quote for this job.</p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Draft messages</h2>
            <div className="mt-4 space-y-3">
              {messages.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No messages drafted yet.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold">{message.subject}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
                    <button className="mt-4 min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                      Review message
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
