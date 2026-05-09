import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", demoUserId)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const [clientResult, invoiceResult, quoteResult, capturesResult, messagesResult] =
    await Promise.all([
      job.client_id
        ? supabase.from("clients").select("*").eq("id", job.client_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("invoices").select("*").eq("job_id", job.id).maybeSingle(),
      supabase.from("quotes").select("*").eq("job_id", job.id).maybeSingle(),
      supabase.from("captures").select("*").eq("job_id", job.id).order("created_at"),
      supabase.from("messages").select("*").eq("job_id", job.id).order("created_at"),
    ]);

  const firstError =
    clientResult.error ??
    invoiceResult.error ??
    quoteResult.error ??
    capturesResult.error ??
    messagesResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    job,
    client: clientResult.data ?? null,
    invoice: invoiceResult.data ?? null,
    quote: quoteResult.data ?? null,
    captures: capturesResult.data ?? [],
    messages: messagesResult.data ?? [],
  });
}
