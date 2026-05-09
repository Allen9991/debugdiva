import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  console.log("[GET /api/jobs/[id]] called with id:", id);

  const job = demoStore.jobs.get(id);
  if (!job) {
    console.log("[GET /api/jobs/[id]] job not found:", id);
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const invoice = demoStore.invoices.forJob(id) ?? null;
  const quotes = demoStore.quotes
    .all()
    .filter((q) => q.job_id === id);
  const quote = quotes[0] ?? null;

  // Synthesise a client/captures/messages shape for the existing UI consumers.
  const client = {
    id: job.client_id ?? `client-${job.id}`,
    name: job.client_name,
    email: job.client_email,
    phone: undefined,
    address: job.location,
  };

  const response = {
    job,
    client,
    invoice,
    quote,
    captures: [],
    messages: [],
  };
  console.log(
    "[GET /api/jobs/[id]] returning job for",
    job.client_name,
    "(status:",
    job.status,
    ")",
  );
  return NextResponse.json(response);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  console.log("[PATCH /api/jobs/[id]] called with id:", id, "body:", body);

  const allowed: Record<string, unknown> = {};
  for (const key of [
    "status",
    "description",
    "location",
    "labour_hours",
    "client_name",
    "client_email",
  ] as const) {
    if (key in body) allowed[key] = body[key];
  }

  const updated = demoStore.jobs.update(id, allowed);
  if (!updated) {
    console.log("[PATCH /api/jobs/[id]] job not found:", id);
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const response = { job: updated };
  console.log("[PATCH /api/jobs/[id]] returning updated job, new status:", updated.status);
  return NextResponse.json(response);
}
