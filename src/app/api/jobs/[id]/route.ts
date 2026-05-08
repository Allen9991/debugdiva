import { NextResponse } from "next/server";

import {
  demoCaptures,
  demoClients,
  demoInvoices,
  demoJobs,
  demoMessages,
  demoQuotes,
} from "@/lib/demo-data";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const job = demoJobs.find((item) => item.id === id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    job,
    client: demoClients.find((item) => item.id === job.client_id) ?? null,
    invoice: demoInvoices.find((item) => item.job_id === job.id) ?? null,
    quote: demoQuotes.find((item) => item.job_id === job.id) ?? null,
    captures: demoCaptures.filter((item) => item.job_id === job.id),
    messages: demoMessages.filter((item) => item.job_id === job.id),
  });
}
